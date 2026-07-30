---
name: gh
description: Common GitHub CLI (gh) operations for this repository — pull requests, issues, releases, and checks. Use whenever the user asks to open/review a PR, check issues, inspect CI, or look at releases on GitHub.
---

# GitHub CLI (gh) for myogi-ban

Repo: `kurokoji/myogi-ban` (remote `origin`), default branch `main`.
`gh` is already authenticated as `kurokoji`. Two workflows exist:
- `.github/workflows/ci.yml` — lint/typecheck/test/build on every push to
  `main` and every pull request. This is what `gh pr checks` reports.
- `.github/workflows/release.yml` — builds and uploads release assets on
  tag push (see Releases below); does not run on PRs.

Check run status with `gh run list --workflow <file>` /
`gh run view <run-id>`.

Always run these from the repository root. Prefer `gh` over raw
`curl`/`gh api` for anything it has a first-class command for; fall back
to `gh api` only when no subcommand covers the need.

## Pull requests

- Status of the current branch's PR: `gh pr view` (add `--json` with
  specific fields when you need to parse output, e.g.
  `gh pr view --json state,mergeable,reviews`).
- List open PRs: `gh pr list`.
- Diff of a PR: `gh pr diff <number>`.
- Comments/review threads: `gh pr view <number> --comments` or
  `gh api repos/kurokoji/myogi-ban/pulls/<number>/comments` for inline
  review comments (the REST comments endpoint, not `gh pr view`, is
  what surfaces line-level review feedback).
- Creating a PR: use the project-wide PR-creation steps already defined
  for this session (check branch state, diff, and history first), then
  `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"`. Keep the
  title under ~70 characters; details go in the body.
- Do not merge, close, or push `--force` to a PR branch without the
  user explicitly asking in that turn — these are visible, hard-to-undo
  actions per this session's standing safety rules.

## Issues

- List: `gh issue list` (add `--state all` to include closed).
- View one: `gh issue view <number>`.
- Create: `gh issue create --title "..." --body "..."`.
- Comment: `gh issue comment <number> --body "..."`.
- Only create/comment/close issues when the user explicitly asks —
  these post publicly and are not easily reversible.

## Releases

Version bumps are still manual: `npm version` (bumps `package.json` +
`package-lock.json`, commits, tags). Pushing a `vX.Y.Z` tag then
triggers `.github/workflows/release.yml`, which lints, typechecks,
tests, builds both Windows installers (`Myogi Ban Setup <version>.exe`
and `Myogi-Ban-OBS-Plugin-Setup-<version>.exe`), and uploads them to a
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

## General

- `gh repo view --json <fields>` for repo metadata (owner, default
  branch, URL) instead of guessing from remotes.
- `gh auth status` if a command unexpectedly fails with an auth error.
- For anything not covered by a `gh` subcommand, use
  `gh api <path> --jq '<filter>'` rather than raw `curl`, so
  authentication is handled automatically.
