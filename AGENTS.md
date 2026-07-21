# Development Guidelines

## Test-Driven Development

Use t-wada-style test-driven development for feature work, bug fixes, and refactoring.

1. Write a short test list describing the expected behaviors and edge cases.
2. Select one behavior and add one test that fails for the expected reason (Red).
3. Run `npm test` and confirm the failure before changing production code.
4. Add only the minimum production code needed to pass that test (Green).
5. Run `npm test` and confirm the complete suite passes.
6. Refactor names, duplication, responsibilities, and structure only while tests remain green.
7. Repeat the cycle one behavior at a time.

Do not implement several behaviors and add tests afterward. Do not skip observing Red merely because the implementation appears straightforward.

For existing behavior that lacks coverage, add characterization tests before refactoring it. Preserve observable behavior unless the task explicitly requests a behavior change. Test through public behavior rather than private implementation details.

Prefer extracting domain logic into small pure functions. Test repository and API boundaries with real temporary files or lightweight fakes where practical; use mocks only at genuine external boundaries.

## Component Design

Keep UI components focused on one cohesive responsibility. Before adding UI to an existing component, review its current responsibilities and extract a child component when the change introduces a separate workflow, independent state, reusable formatting, or a distinct dialog/panel.

Treat roughly 200 lines or several unrelated interaction groups as a review signal, not a target. Do not wait for a component to become difficult to navigate before splitting it. Container components should coordinate data and callbacks; focused child components should own the markup and local state for a single interaction.

When feature work makes a touched component materially larger, include the responsibility split in the same change while tests are green. Avoid line-count-only extraction: each new component must have a clear name, narrow props, and a coherent reason to change.

## Verification

Keep every commit green. Before committing completed work, run:

```bash
npm run check
npm run typecheck
npm test
npm run build
```

Separate behavior changes from structural refactoring when practical. Never commit a known Red state unless the user explicitly requests a work-in-progress commit.

## Refactoring Backlog

Use `docs/REFACTORING.md` as the refactoring backlog. Before starting a refactor, select an unchecked item and follow the TDD workflow above. After the implementation and full verification pass, change its checkbox to `[x]` and include that update in the same commit as the refactor.
