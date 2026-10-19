# Contributing to Dostyq PDF

`main` is the single source of truth: always stable, always deployable. Every
change lands on `main` through a short-lived branch and a pull request — never by
committing to `main` directly.

## Branching model

Branches in git are independent pointers. Work on one branch never touches
another; only committing *while on* a branch changes it. So one improvement =
one branch, always started from an up-to-date `main`.

```bash
git checkout main
git pull                          # get the latest main
git checkout -b feat/my-change    # isolated branch
# ...work, commit...
git push -u origin feat/my-change
gh pr create --base main          # open a PR for review
```

Once the PR is merged, `main` advances and the feature branch has done its job —
delete it or leave it; `main` never depends on it.

### Branch names

Use a `type/short-description` slug, matching the commit types below:

- `feat/…` — new functionality
- `fix/…` — bug fix
- `refactor/…` — internal change, no behavior difference
- `chore/…` — tooling, config, deps
- `docs/…` — documentation only

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

- **Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `build`, `perf`.
- **Scope** is optional but encouraged (e.g. `scanner`, `i18n`, `sdd`).
- Use `!` after the type/scope for a breaking change: `feat(scanner)!: …`.
- Keep the summary imperative and under ~72 chars: "add", not "added".

Examples:

```
feat(scanner): add one-tap PDF export from the tray
fix(scanner): close originalBitmap even when materializeRawCapture rejects
chore: gitignore engram local export chunks
```

## Before opening a PR

Run the checks locally so review stays focused on the change, not the noise:

```bash
npm run typecheck   # types
npm test            # unit tests (vitest)
npm run build       # type-check + production build
npm run test:e2e    # end-to-end tests (Playwright; builds the app itself;
                    # first run `npx playwright install chromium webkit`)
```

Keep PRs small and scoped to one concern. A large PR is harder to review and
riskier to merge — split unrelated work into separate branches.

## Pull requests

- Target `main` as the base branch.
- Write a title that summarizes the change and a body covering **what** changed,
  **why**, and anything a reviewer should know.
- A PR that is a pure fast-forward of `main` can be merged with a linear history
  (`git merge --ff-only` + push, or the PR's rebase option); otherwise a merge
  commit is fine.

## Translations

The interface is available in Kazakh and Russian. `src/shared/i18n/en.ts` is the
source dictionary: it defines every key, and `kk.ts` and `ru.ts` must contain all
of them (the compiler checks this). English is not offered in the interface.
Corrections to the Kazakh text from native speakers are especially welcome.

## Project layout & workflow

See the [README](README.md) for setup, scripts and the OpenCV-in-dev caveat. The
design notes in `docs/superpowers/` come from the original Nitidoc project.
