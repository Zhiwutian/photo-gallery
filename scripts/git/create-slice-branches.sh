#!/usr/bin/env bash
# Create local feature branches for future PROPOSAL slices from current HEAD (usually main).
set -euo pipefail
base="${1:-HEAD}"
branches=(
  "feat/slice-02-google-oauth-session"
  "feat/slice-03-core-drive-gallery"
  "feat/slice-04-folder-picker-home"
  "feat/slice-05-deploy-render-vercel"
  "feat/slice-06-uploads-folders"
  "feat/slice-07-public-links-sa"
  "feat/slice-08-gated-landing"
  "feat/slice-09-future-docs"
)
for b in "${branches[@]}"; do
  if git show-ref --verify --quiet "refs/heads/$b"; then
    echo "exists: $b"
  else
    git branch "$b" "$base"
    echo "created: $b <- $base"
  fi
done
echo "Done. Push with: git push -u origin <branch-name>"
