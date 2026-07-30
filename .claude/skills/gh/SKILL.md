---
name: gh
description: Common GitHub CLI (gh) operations for this repository — pull requests, issues, and checks. Use whenever the user asks to open/review a PR, check issues, or inspect CI. For version bumps, tagging, and release notes, use the gh-release skill instead.
---

# GitHub CLI (gh) for myogi-ban

Repo: `kurokoji/myogi-ban` (remote `origin`), default branch `main`.
`gh` is already authenticated as `kurokoji`. Two workflows exist:
- `.github/workflows/ci.yml` — lint/typecheck/test/build on every push to
  `main` and every pull request. This is what `gh pr checks` reports.
- `.github/workflows/release.yml` — builds and uploads release assets on
  tag push; does not run on PRs. See the `gh-release` skill for the full
  version-bump-to-published-release workflow.

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

## General

- `gh repo view --json <fields>` for repo metadata (owner, default
  branch, URL) instead of guessing from remotes.
- `gh auth status` if a command unexpectedly fails with an auth error.
- For anything not covered by a `gh` subcommand, use
  `gh api <path> --jq '<filter>'` rather than raw `curl`, so
  authentication is handled automatically.
