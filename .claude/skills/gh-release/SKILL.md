---
name: gh-release
description: Version bump, tag, monitor release CI, write bilingual release notes, and publish for this repository. Use whenever the user asks to release, tag, ship a new version, or write/publish release notes.
---

# Releases for myogi-ban

Repo: `kurokoji/myogi-ban` (remote `origin`), default branch `main`.
`gh` is already authenticated as `kurokoji`. For general PR/issue/check
operations, see the `gh` skill — this one is specifically about
shipping a new version.

Version bumps are still manual: `npm version` (bumps `package.json` +
`package-lock.json`, commits, tags). Pushing a `vX.Y.Z` tag triggers
`.github/workflows/release.yml`, which lints, typechecks, tests,
builds both Windows installers (`Myogi Ban Setup <version>.exe` and
`Myogi-Ban-OBS-Plugin-Setup-<version>.exe`), and uploads them to a
**draft** release for that tag (creating it if it doesn't exist yet).
The workflow deliberately leaves the release notes empty — this
project writes bilingual (Japanese + English) notes by hand, so notes
still need a manual `gh release edit <tag> --notes-file <path>` before
publishing. Publishing the draft itself (`gh release edit <tag>
--draft=false`) is also a manual, explicit step.

- List: `gh release list`.
- Inspect one (including assets): `gh release view <tag>`.
- Check for in-progress drafts before assuming the release process
  hasn't started: `gh api repos/kurokoji/myogi-ban/releases --jq '.[] | select(.draft==true)'`.
  A draft can exist with an empty `tag_name` if assets were uploaded
  before the tag was finalized.
- Publishing a release or editing a published release's notes/assets
  are visible, shared-state actions — confirm the exact tag, notes,
  and asset list with the user before running `gh release edit
  --draft=false` or re-uploading assets by hand.

## Full release runbook

The end-to-end flow this project actually uses, in order. Confirm with
the user before each git-visible step (version bump/tag, pushing,
publishing) unless they've already asked for the whole sequence in one
go.

1. **Finish and commit the code change first.** Never bump the version
   with uncommitted work in the tree — `npm version` will refuse, or
   worse, bundle unrelated changes into the release commit.
2. **Bump the version**: `npm version patch -m "release %s"` (or
   `minor`/`major`). This bumps `package.json`, commits, and creates
   the `vX.Y.Z` tag locally in one step — nothing is pushed yet.
3. **Push the commit and the tag as two separate commands**:
   `git push origin main` then `git push origin vX.Y.Z`. Pushing the
   tag is what triggers `release.yml` for real (uses CI minutes,
   becomes visible on GitHub), so only do this once the user has
   actually asked for it.
4. **Find and monitor the triggered run**:
   `gh run list --workflow release.yml --limit 3` to get the new
   run's id, then `gh run view <run-id>`. The OBS plugin's native C++
   build makes this take roughly 5–6 minutes — don't poll tightly.
   Use `ScheduleWakeup` with a ~330s delay, and put the exact
   follow-up instructions (the run id and tag) directly in the
   wakeup's `prompt` so the next turn has everything it needs without
   re-deriving context.
   - If the run fails, `gh run view <run-id> --log-failed` (or open
     the run URL) to diagnose before retrying. A common failure mode
     from this project's history: electron-builder attempting an
     implicit GitHub publish on a tagged CI run — fixed by passing
     `--publish=never` to the build step, not by disabling the
     workflow.
   - If code changes after the tag was created (e.g. a CI-only fix),
     the tag must be moved to the fixed commit before re-running:
     `git tag -f vX.Y.Z HEAD && git push origin vX.Y.Z --force`. This
     is a force-push — always get explicit confirmation first, and
     run the two commands separately if a combined
     `tag && push` gets blocked by the permission classifier (a
     blocked compound command may not execute either half).
5. **Once the run succeeds, write bilingual release notes.** Look at
   what actually shipped since the previous tag —
   `git log --oneline vPREVIOUS..vX.Y.Z` — and write user-facing
   Japanese first, then English, to a scratchpad file (not the repo),
   using this exact shape:

   ```markdown
   ## 日本語
   - ユーザー向けの変更点を日本語で箇条書き

   ## English
   - The same changes, in English
   ```

   Keep entries user-facing (what changed for them), not a commit-log
   dump — skip pure refactors/internal test changes unless they fixed
   a user-visible bug.
6. **Apply the notes**: `gh release edit vX.Y.Z --notes-file <path>`.
   The release stays a draft at this point.
7. **Publish only with explicit confirmation**:
   `gh release edit vX.Y.Z --draft=false`. Report the final release
   URL back to the user afterward.
