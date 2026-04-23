# Git flow — photo-gallery

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Always deployable; merge only via reviewed PRs (or self-merge with CI green). |
| `feat/slice-NN-short-slug` | One branch per [PROPOSAL](./PROPOSAL.md) slice (see table below). |

### Slice branch names (use these exact prefixes)

| Slice | Branch |
|-------|--------|
| 1 | `feat/slice-01-postgres-users` |
| 2 | `feat/slice-02-google-oauth-session` |
| 3 | `feat/slice-03-core-drive-gallery` |
| 4 | `feat/slice-04-folder-picker-home` |
| 5 | `feat/slice-05-deploy-render-vercel` |
| 6 | `feat/slice-06-uploads-folders` |
| 7 | `feat/slice-07-public-links-sa` |
| 8 | `feat/slice-08-gated-landing` |
| 9 | `feat/slice-09-future-docs` |

Optional hardening (post–v1): create **`feat/slice-h1-…`** style branches from `main` when you pick up [PROPOSAL optional table](./PROPOSAL.md#optional-follow-up-slices-postv1-hardening).

## Workflow

1. **`git checkout main` && `git pull origin main`**
2. **Start slice N:** `git checkout -b feat/slice-NN-…` *or* if the placeholder branch already exists remotely:  
   `git fetch origin && git checkout feat/slice-NN-… && git merge origin/main` (bring in completed slices).
3. **Implement** with small commits; keep **`pnpm lint`**, **`pnpm typecheck`**, **`pnpm test`**, **`pnpm build`** green.
4. **Open PR → `main`**; use the [PR template](../.github/pull_request_template.md).
5. **Merge** (squash or merge commit — team preference). Delete the remote feature branch after merge if you like a tidy repo.

## Placeholder branches

If slice branches were created early at the same commit as `main`, **before starting work** on slice N, update that branch with latest `main`:

```bash
git checkout feat/slice-02-google-oauth-session
git merge origin/main
# resolve conflicts if any, then continue
```

Do **not** force-push shared `main`.

## Scripts

To (re)create local slice branches from current `main` without checking them out:

```bash
./scripts/git/create-slice-branches.sh
```

Push new branches to GitHub:

```bash
git push -u origin feat/slice-01-postgres-users   # example
# or push all local branches: use care; see git push --help
```
