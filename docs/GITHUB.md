# GitHub — `photo-gallery`

**Canonical repository:** [https://github.com/Zhiwutian/photo-gallery](https://github.com/Zhiwutian/photo-gallery)

Clone:

```bash
git clone https://github.com/Zhiwutian/photo-gallery.git
cd photo-gallery
```

The sections below apply if you **fork** the repo or add a second remote. Do **not** paste personal access tokens into chat or commit them.

## Option A — GitHub CLI (`gh`)

1. [Install GitHub CLI](https://cli.github.com/) and run `gh auth login`.
2. From the `photo-gallery` folder:

```bash
git remote add origin https://github.com/YOUR_USER/photo-gallery.git
# or SSH:
# git remote add origin git@github.com:YOUR_USER/photo-gallery.git

git push -u origin main
```

Create the empty repo first on GitHub (**New repository**), or:

```bash
gh repo create photo-gallery --private --source=. --remote=origin --push
```

(Adjust `--public` / `--private` and name as needed.)

## Option B — GitHub website

1. Create a new repository (no README, no .gitignore) named e.g. `photo-gallery`.
2. Add remote and push:

```bash
git remote add origin https://github.com/YOUR_USER/photo-gallery.git
git branch -M main
git push -u origin main
```

## Remote dev / Codespaces

After the repo exists on GitHub, you can:

- **GitHub Codespaces** — open the repo → Code → Codespaces (add a devcontainer if not auto-detected; this repo includes `.devcontainer`).
- **Cursor / VS Code Remote** — clone locally or use Remote-SSH; **Reopen in Container** uses `.devcontainer` here.

## Nested clone inside another monorepo

If you keep a copy under another project folder, add that path to the **parent** repo’s `.gitignore` so you do not commit a nested `.git` by mistake.
