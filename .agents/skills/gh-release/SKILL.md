---
name: gh-release
description: Prepare and publish releases for this repository, including version bumps, tags, release CI monitoring, bilingual release notes, and draft publication. Use when the user asks to release, tag, ship a new version, or write or publish release notes. Use the gh skill for general PR, issue, and check operations.
---

# Releases for myogi-ban

Run commands from the repository root. The repository is
`kurokoji/myogi-ban`, its default branch is `main`, and its remote is
`origin`.

Version bumps are manual. `npm version` updates `package.json` and
`package-lock.json`, creates a commit, and creates a tag. Pushing a `vX.Y.Z`
tag triggers `.github/workflows/release.yml`. The workflow builds both Windows
installers and uploads them to a draft release:

- `Myogi Ban Setup <version>.exe`
- `Myogi-Ban-OBS-Plugin-Setup-<version>.exe`

The workflow leaves release notes empty. Add bilingual notes manually, then
publish the draft only after explicit user confirmation.

Useful inspection commands:

- `gh release list`
- `gh release view <tag>`
- `gh api repos/kurokoji/myogi-ban/releases --jq '.[] |
  select(.draft==true)'`

A draft may temporarily have an empty `tag_name` when assets arrive before the
tag is finalized.

## Release workflow

Confirm shared, git-visible actions with the user unless their request already
authorizes the complete release workflow.

1. Ensure the intended code is committed and the worktree contains no
   unrelated changes. Never let `npm version` bundle unrelated changes.
2. Bump the requested version with `npm version patch -m "release %s"`, or
   use `minor` or `major` as requested. This creates the commit and tag locally.
3. Push the commit and tag separately: `git push origin main`, then `git push
   origin vX.Y.Z`. The tag push triggers release CI and consumes CI resources.
4. Find the new run with `gh run list --workflow release.yml --limit 3`, then
   inspect it with `gh run view <run-id>`.
5. Monitor the run with Codex's supported recurring wait or monitoring
   mechanism. The native OBS plugin build usually takes roughly 5–6 minutes.
   Do not use a long blocking shell sleep or poll tightly.
6. If the run fails, inspect it with `gh run view <run-id> --log-failed` before
   retrying. A known historical failure was electron-builder attempting an
   implicit GitHub publish on tagged CI; the fix is `--publish=never` on the
   build step, not disabling the workflow.
7. If code changes after the tag was created, ask for explicit confirmation
   before moving or force-pushing the tag. Then run `git tag -f vX.Y.Z HEAD`
   and `git push origin vX.Y.Z --force` as separate commands.
8. After CI succeeds, inspect what shipped with `git log --oneline
   vPREVIOUS..vX.Y.Z` and draft release notes in a temporary file outside the
   repository using this structure:

   ```markdown
   ## 日本語
   - ユーザー向けの変更点を日本語で箇条書き

   ## English
   - The same changes, in English
   ```

   Describe user-visible outcomes rather than dumping commit messages. Omit
   internal refactors and tests unless they fixed a user-visible problem.
9. Apply notes with `gh release edit vX.Y.Z --notes-file <path>`. Keep the
   release as a draft.
10. Publish only after explicit confirmation with `gh release edit vX.Y.Z
    --draft=false`, then report the final release URL.

Editing a published release's notes or assets is also a visible shared-state
action. Confirm the exact tag, notes, and asset list before doing so.
