---
name: gh
description: Common GitHub CLI operations for this repository, including pull requests, issues, workflow runs, and checks. Use when the user asks to open or review a PR, inspect review comments, check issues, or inspect CI. For version bumps, tags, and releases, use the gh-release skill instead.
---

# GitHub CLI for myogi-ban

Run commands from the repository root. The repository is
`kurokoji/myogi-ban`, its default branch is `main`, and its remote is
`origin`.

Prefer first-class `gh` commands over raw `curl` or `gh api`. Use `gh api`
only when no first-class subcommand exposes the required information. Check
authentication with `gh auth status` if a command fails unexpectedly.

The repository has two workflows:

- `.github/workflows/ci.yml` runs lint, typecheck, tests, and build on pushes
  to `main` and on pull requests. This is what `gh pr checks` reports.
- `.github/workflows/release.yml` builds and uploads release assets after a
  tag is pushed. Use the `gh-release` skill for that workflow.

## Pull requests

- Inspect the current branch's PR with `gh pr view`. Request only needed JSON
  fields when parsing output, for example `gh pr view --json
  state,mergeable,reviews`.
- List open PRs with `gh pr list`.
- Read a PR diff with `gh pr diff <number>`.
- Read general comments with `gh pr view <number> --comments`.
- Read line-level review comments with `gh api
  repos/kurokoji/myogi-ban/pulls/<number>/comments`.
- Before creating a PR, inspect branch state, the diff, and recent history.
  Keep the title under roughly 70 characters and put details in the body.
- Do not merge, close, or force-push a PR branch unless the user explicitly
  asks in the current turn.

## Issues

- List issues with `gh issue list`; add `--state all` when closed issues are
  relevant.
- Inspect one issue with `gh issue view <number>`.
- Create an issue with `gh issue create --title "..." --body "..."`.
- Comment with `gh issue comment <number> --body "..."`.
- Create, comment on, or close issues only when the user explicitly asks,
  because these actions modify shared GitHub state.

## Repository and CI

- Query repository metadata with `gh repo view --json <fields>` instead of
  guessing from remotes.
- List workflow runs with `gh run list --workflow <file>`.
- Inspect a run with `gh run view <run-id>`.
- Inspect failed logs with `gh run view <run-id> --log-failed`.
