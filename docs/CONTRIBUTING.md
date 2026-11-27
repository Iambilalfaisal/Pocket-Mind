# Contributing to PocketMind

This applies to everyone working in the repo, human or AI agent.

## Branching model: GitHub Flow

- `main` is always releasable and protected. Nobody commits to it directly.
- Every change happens on a short-lived branch created from the latest `main`, and lands through a pull request.
- One branch = one focused change. If a branch starts doing two things, split it.
- Delete the branch after merging (GitHub can do this automatically).

```bash
git switch main
git pull
git switch -c feat/chat-screen
# ...work, commit...
git push -u origin feat/chat-screen
# open a PR into main
```

### Branch names

`<type>/<short-kebab-description>`

| Type | Use for |
|---|---|
| `feat/` | New user-facing capability |
| `fix/` | Bug fix |
| `refactor/` | Code change with no behaviour change |
| `chore/` | Tooling, dependencies, scaffolding |
| `ci/` | GitHub Actions and build pipelines |
| `docs/` | Documentation only |
| `test/` | Tests only |
| `ml/` | Python ML pipeline work (Stage 2) |

Examples: `feat/model-storage`, `fix/download-resume`, `ci/mobile-build-pipelines`.

## Commits: Conventional Commits

`<type>(<scope>): <summary in imperative mood>`

Scopes: `mobile`, `ml`, `ci`, `docs`, `repo`.

```
feat(mobile): add resumable model downloads
fix(mobile): stop generation when app goes to background
ci(mobile): add unsigned iOS build workflow
docs(repo): document sideloading steps
```

- Summary ≤ 72 characters, no trailing period.
- Body (optional) explains why, not what.
- Each commit should leave the project building and tests passing.

## Pull requests

- Fill in the PR template completely.
- Link the issue: `Closes #12`.
- Keep PRs small: aim for under ~400 changed lines (lockfiles excluded). Large changes are split into a sequence of PRs.
- CI must be green before merge.
- Merge method: **squash merge**. The PR title becomes the commit on `main`, so it must follow Conventional Commits.
- The AI agent opens PRs but never merges them. The developer reviews every PR.

### Review checklist

- [ ] Does it do one thing, and is that thing in scope?
- [ ] Is it the simplest correct solution? Could anything be deleted?
- [ ] Are names clear enough that comments are rarely needed?
- [ ] Are errors handled and surfaced to the user properly?
- [ ] Are the `core/` changes covered by tests?
- [ ] Does it respect the layer and traceability rules in `CLAUDE.md` (same shape, one native library per file, module-prefixed error codes, scoped logs)?
- [ ] If something breaks here later, will the error code and logs point straight to this code?
- [ ] Does it add a native dependency? (Needs explicit approval and a new cloud build.)
- [ ] `docs/ARCHITECTURE.md`, `docs/DEBUGGING.md` and `docs/LEARNINGS.md` updated where relevant?

## Issues and tracking

- One GitHub issue per task, with a clear "done when" line.
- A milestone per release (`v0.1.0 — Sunday demo`).
- Optional: a GitHub Project board with columns To do / In progress / In review / Done.

## Releases and versioning

- Semantic Versioning, starting at `v0.1.0` for the first demo.
- Release = a tag on `main` (`git tag v0.1.0 && git push origin v0.1.0`) plus a GitHub Release with notes and the `.ipa` / `.apk` attached.
- Keep `version` in `app.config.ts` in sync with the tag.

## Branch protection settings for `main` (set once in GitHub)

Settings → Branches → Add rule for `main`:

- Require a pull request before merging (required approvals: 0 while you are the only developer; raise it when the team grows).
- Require status checks to pass: `mobile-ci` (it appears in the list after it has run once).
- Require branches to be up to date before merging.
- Require linear history.
- Block force pushes and deletions.

## Quality bar

**Quality over quantity.** The goal is the least code that solves the problem correctly and readably.

### All code

- No dead code, commented-out code, placeholder files or speculative abstractions.
- No TODO without a linked issue (`// TODO(#14): ...`).
- Functions do one thing; files stay small and focused.
- Names describe intent; comments explain why, never restate what.
- Errors are handled explicitly and surfaced with clear messages; no swallowed exceptions.
- No secrets or credentials in the repo, ever.

### TypeScript (`apps/mobile`)

- `strict: true`. No `any` except at third-party boundaries, wrapped and commented.
- ESLint (`eslint-config-expo`) + Prettier with zero warnings.
- Named exports; components in PascalCase files; hooks start with `use`.
- Unit tests (jest-expo) for everything in `core/`. Test behaviour, not implementation details.
- Required before every PR: `npm run lint`, `npm run typecheck`, `npm test`, and `npx expo export` for ios and android.

### Python (`ml/`, Stage 2)

- Python 3.12, managed with `uv`; dependencies pinned in `pyproject.toml` + `uv.lock`.
- `ruff` for lint and format, `pyright` in strict mode, `pytest` for tests.
- Logic lives in a package (`ml/src/pocketmind_ml/`); notebooks (for Colab GPUs) are thin and call package code.
- Training settings live in versioned config files, not hard-coded.
- No datasets, model weights or notebook outputs committed; store them on Hugging Face Hub or Drive and reference them by URL/version.

## Definition of done

A task is done when:

1. The PR is merged into `main` with green CI.
2. What was verified is written in the PR (and on-device results, if a cloud build was needed).
3. Docs reflect the change.
4. The linked issue is closed.
