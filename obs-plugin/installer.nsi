Unicode true
RequestExecutionLevel admin

!include "MUI2.nsh"

!define PRODUCT_NAME "Myogi Ban OBS Plugin"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\MyogiBanObsPlugin"

Name "${PRODUCT_NAME} ${APP_VERSION}"
OutFile "${OUTPUT_FILE}"
InstallDir "$APPDATA\obs-studio\plugins\myogi-ban-obs"

Function .onInit
  SetShellVarContext all
  StrCpy $INSTDIR "$APPDATA\obs-studio\plugins\myogi-ban-obs"
FunctionEnd

Function un.onInit
  SetShellVarContext all
FunctionEnd

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Japanese"
!insertmacro MUI_LANGUAGE "English"

Section "Myogi Ban OBS Plugin" SecPlugin
  SetRegView 64
  SetOutPath "$INSTDIR\bin\64bit"
  File "/oname=myogi-ban-obs.dll" "${PLUGIN_DLL}"

  SetOutPath "$INSTDIR\data"
  File /r "${PLUGIN_DATA}\*.*"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "Publisher" "Myogi Ban"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegDWORD HKLM "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINSTALL_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  SetRegView 64
  DeleteRegKey HKLM "${UNINSTALL_KEY}"
  RMDir /r "$INSTDIR"
SectionEnd
