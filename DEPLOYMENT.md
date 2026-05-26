# Deployment Workflow

This repository deploys through a single pipeline:

GitHub `main` -> Vercel production project `cookbook-app` -> production domain.

## Vercel Project

- Active local link: `.vercel/project.json`
- Project name: `cookbook-app`
- Production branch: `main`
- Preview branches: any non-main branch or pull request
- Supabase backend: single cookbook Supabase project

The duplicate `my-cookbook` Vercel project was removed on 2026-05-26. `cookbook-app` is the single production project for this repository.

## Safety Checks

Run before production pushes:

```bash
npm run verify
npm run validate:env
```

Git hooks live in `.githooks`. Enable them once per clone:

```bash
git config core.hooksPath .githooks
```

## Commit Style

Use semantic commits:

- `feat(scope): summary`
- `fix(scope): summary`
- `style(scope): summary`
- `refactor(scope): summary`
- `perf(scope): summary`
- `chore(scope): summary`
- `docs(scope): summary`

Include changed modules, migration notes, and deployment notes in the commit body for larger releases.

## Rollback

If a production deployment fails after push:

1. Use Vercel's deployment history to promote the last healthy deployment.
2. Revert the bad commit with `git revert <sha>`.
3. Push `main` to trigger a clean production deployment.
