# OLMIES/Campus Companion Agent Guide

This file documents the standard branch workflow, deployment behavior, and critical operational rules for future agent sessions and contributors.

# OLMIES Standard Git Workflow

## 1. Start work

```bash
git checkout dev
git pull origin dev
```

Make changes locally.

## 2. Commit to dev

```bash
git status
git add .
git commit -m "Your message"
git push origin dev
```

Now `origin/dev` has your latest work.

## 3. Promote dev to test

```bash
git checkout test
git pull origin test
git merge dev
git push origin test
git checkout dev
```

Now `test` is updated from `dev`.

## 4. Promote tested work to production

```bash
git checkout production-2
git pull origin production-2
git merge test
git push origin production-2
git checkout dev
```

Now production deployment is triggered.

# Simple Branch Meaning

```text
dev          = where you work
test         = where you test what came from dev
production-2 = where deployment happens
```

# Important Operational Notes

Always begin on a new machine/session with:

```bash
git checkout dev
git pull origin dev
```

Before making changes, run:

```bash
git branch --show-current
```

This helps prevent accidental commits to the wrong branch.

# Golden Rule

Never commit directly to:

* `test`
* `production-2`

Only merge into them.

# Workflow File Rules

The workflow files are intentionally different by branch.

* `dev`:
  * no deployment workflow

* `test`:
  * keep `.github/workflows/deploy-railway-test.yml` only

* `production-2`:
  * keep `.github/workflows/deploy-azure-production.yml` only

If a merge conflict involves workflow files:

* preserve the target branch's workflow file
* do not copy workflow files across branches

# Environment Notes

* Railway test is the active test environment.
* Azure production is the real production environment.
* Railway production is legacy/stale and should not be used for normal deployment verification.

# Purpose

This workflow exists to keep:

* environments predictable
* deployments controlled
* testing isolated
* production safe
