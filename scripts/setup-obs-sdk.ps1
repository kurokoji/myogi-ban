[CmdletBinding()]
param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\.obs-sdk"),
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$obsVersion = "32.1.2"
$windowsArchiveName = "OBS-Studio-32.1.2-Windows-x64.zip"
$windowsArchiveHash = "8d97e4563bd8d22d03e63042aa7dccede1d555c9bd35ce8a9e5019b0d0201bf6"
$sourceArchiveName = "OBS-Studio-32.1.2-Sources.tar.gz"
$sourceArchiveHash = "c6532380c68a75327fe8b551461adeca8f184dcbe4015096251a6de76362a554"
$releaseBaseUrl = "https://github.com/obsproject/obs-studio/releases/download/$obsVersion"

function Get-VerifiedArchive {
  param(
    [string]$Name,
    [string]$ExpectedHash,
    [string]$Destination
  )

  Invoke-WebRequest -Uri "$releaseBaseUrl/$Name" -OutFile $Destination
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $Destination).Hash
  if ($actualHash -ne $ExpectedHash) {
    throw "Checksum mismatch for $Name. Expected $ExpectedHash, got $actualHash."
  }
}

function Find-VisualStudioTool {
  param([string]$ToolName)

  $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
  if (Test-Path -LiteralPath $vswhere) {
    $installationPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($installationPath) {
      $tool = Get-ChildItem -LiteralPath (Join-Path $installationPath "VC\Tools\MSVC") -Recurse -Filter $ToolName |
        Where-Object { $_.FullName -match '\\Hostx64\\x64\\' } |
        Sort-Object FullName -Descending |
        Select-Object -First 1
      if ($tool) { return $tool.FullName }
    }
  }

  $toolFromPath = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($toolFromPath) { return $toolFromPath.Source }
  throw "$ToolName was not found. Install the Visual Studio C++ build tools."
}

$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
if ((Test-Path -LiteralPath $resolvedOutput) -and -not $Force) {
  throw "$resolvedOutput already exists. Pass -Force to replace it."
}

$workingDirectory = Join-Path ([IO.Path]::GetTempPath()) ("myogi-ban-obs-sdk-" + [guid]::NewGuid())
$stagingDirectory = Join-Path $workingDirectory "sdk"
New-Item -ItemType Directory -Path $workingDirectory, $stagingDirectory | Out-Null

try {
  $windowsArchive = Join-Path $workingDirectory $windowsArchiveName
  $sourceArchive = Join-Path $workingDirectory $sourceArchiveName
  Get-VerifiedArchive $windowsArchiveName $windowsArchiveHash $windowsArchive
  Get-VerifiedArchive $sourceArchiveName $sourceArchiveHash $sourceArchive

  $windowsFiles = Join-Path $workingDirectory "windows"
  $sourceFiles = Join-Path $workingDirectory "sources"
  Expand-Archive -LiteralPath $windowsArchive -DestinationPath $windowsFiles
  New-Item -ItemType Directory -Path $sourceFiles | Out-Null
  & tar.exe "--exclude=*/build-aux/*" -xf $sourceArchive -C $sourceFiles
  if ($LASTEXITCODE -ne 0) { throw "Failed to extract $sourceArchiveName." }

  $obsDll = Get-ChildItem -LiteralPath $windowsFiles -Recurse -Filter obs.dll |
    Where-Object { $_.FullName -match '\\bin\\64bit\\obs\.dll$' } |
    Select-Object -First 1
  $sourceRoot = Get-ChildItem -LiteralPath $sourceFiles -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "libobs\obs-config.h") } |
    Select-Object -First 1
  if (-not $obsDll) { throw "The Windows archive does not contain bin\64bit\obs.dll." }
  if (-not $sourceRoot) { throw "The source archive does not contain libobs\obs-config.h." }

  $includeDirectory = Join-Path $stagingDirectory "include"
  $libDirectory = Join-Path $stagingDirectory "lib"
  $cmakeDirectory = Join-Path $stagingDirectory "cmake"
  New-Item -ItemType Directory -Path $includeDirectory, $libDirectory, $cmakeDirectory | Out-Null
  Copy-Item -LiteralPath $sourceRoot.FullName -Destination (Join-Path $stagingDirectory "source") -Recurse
  Copy-Item -LiteralPath $obsDll.FullName -Destination (Join-Path $libDirectory "obs.dll")

  @'
#pragma once

#define OBS_DATA_PATH "data"
#define OBS_PLUGIN_PATH "obs-plugins"
#define OBS_PLUGIN_DESTINATION "obs-plugins"
#define OBS_RELEASE_CANDIDATE 0
#define OBS_BETA 0
'@ | Set-Content -LiteralPath (Join-Path $includeDirectory "obsconfig.h") -Encoding utf8

  $dumpbin = Find-VisualStudioTool "dumpbin.exe"
  $lib = Find-VisualStudioTool "lib.exe"
  $exports = & $dumpbin /nologo /exports $obsDll.FullName |
    ForEach-Object {
      if ($_ -match '^\s+\d+\s+[0-9A-F]+\s+[0-9A-F]+\s+(\S+)') { $Matches[1] }
    } |
    Sort-Object -Unique
  if (-not $exports) { throw "No exports were found in obs.dll." }

  $definitionFile = Join-Path $libDirectory "obs.def"
  @("LIBRARY obs.dll", "EXPORTS") + $exports |
    Set-Content -LiteralPath $definitionFile -Encoding ascii
  & $lib /nologo "/def:$definitionFile" /machine:x64 "/out:$(Join-Path $libDirectory 'obs.lib')"
  if ($LASTEXITCODE -ne 0) { throw "Failed to generate obs.lib." }

  @'
get_filename_component(_obs_sdk_root "${CMAKE_CURRENT_LIST_DIR}/.." ABSOLUTE)
if(NOT TARGET OBS::libobs)
  add_library(OBS::libobs SHARED IMPORTED)
  set_target_properties(OBS::libobs PROPERTIES
    IMPORTED_IMPLIB "${_obs_sdk_root}/lib/obs.lib"
    INTERFACE_INCLUDE_DIRECTORIES "${_obs_sdk_root}/include;${_obs_sdk_root}/source;${_obs_sdk_root}/source/libobs"
  )
endif()
set(libobs_FOUND TRUE)
'@ | Set-Content -LiteralPath (Join-Path $cmakeDirectory "libobsConfig.cmake") -Encoding utf8

  if (Test-Path -LiteralPath $resolvedOutput) {
    Remove-Item -LiteralPath $resolvedOutput -Recurse -Force
  }
  Move-Item -LiteralPath $stagingDirectory -Destination $resolvedOutput
  Write-Host "OBS $obsVersion SDK prepared at $resolvedOutput"
} finally {
  if (Test-Path -LiteralPath $workingDirectory) {
    Remove-Item -LiteralPath $workingDirectory -Recurse -Force
  }
}
