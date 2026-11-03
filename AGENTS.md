# OLMIES/Campus Companion Agent Guide

This file documents the standard branch workflow, deployment behavior, and critical operational rules for future agent sessions and contributors.

# Standing Operational Rules (all OLMIES repositories)

These are permanent project rules for every human contributor and AI coding agent (Claude,
Codex and others). They take precedence over any older instruction in this file. The same
wording appears in `olmies-ai`, `olmies-mobile` and `ISAS.IntegrationAPI`; only the
"This repository" section differs.

## Branches and deployment

* `dev` is for active development and integration. It has no deployment workflow.
* `test` is the testing branch. A push to `test` runs that repository's TEST workflow (see
  "This repository").
* The production branch (`production-2`; `production` in ISAS.IntegrationAPI) is the
  production deployment branch.
* Production is deliberately and significantly behind TEST. This is intentional. Do not treat it
  as branch drift, and do not synchronize, merge or promote anything into the production branch.

## Production protection

No AI coding agent is authorized to:

* push to or merge into the production branch;
* deploy application changes to Azure Production;
* modify production databases;
* change production environment variables or secrets;
* run production migrations or data resets;
* stop or restart production services.

Any production action needs the repository owner's explicit authorization for that specific
action. A security vulnerability found in Production is reported to the owner immediately, with
recommended containment, and does not by itself authorize any production change.

## Development and TEST workflow

1. Develop and commit on `dev` or a feature branch created from it.
2. Integrate verified changes into `dev`.
3. Run the relevant security and functional tests.
4. Promote approved changes from `dev` to `test`.
5. Let the existing TEST workflow run.
6. Verify the deployed TEST host with the security and functional smoke tests.

Before promoting to `test`, confirm the exact deployment trigger AND the database the TEST host
uses (see "Databases"). Do not rewrite Git history, squash unrelated commits or overwrite
existing work without authorization.

## Databases

Never assume two services are isolated because their environment names differ. Before any
deployment, migration, seeding or data change, check which database each affected host actually
uses. Never put credentials or connection strings in this file.

## Security and functionality

Security and working functionality are equally important. A security fix keeps the legitimate
behaviour or ships a secure replacement. Temporarily disabling an insecure feature is acceptable
containment, but it is not the finished fix for a feature OLMIES needs. Priorities: working
authentication; student, lecturer and administrator access; SIM surveys and analytics; AI Help
Desk; ISAS integration; the mobile app.

## Engineering and testing

* Do not repeat repository-wide assessments once the relevant findings exist.
* Run focused tests while developing, and the broader regression suites at integration and
  release checkpoints.
* Keep implementation reports concise.
* Never weaken, skip or delete a security test to get a passing result.

## This repository: olmies-mobile (verified 2026-11-03)

| Branch | Workflow on that branch | Result |
| --- | --- | --- |
| `dev` | none on `origin/dev`; the security remediation branch adds `security-ci.yml` (tests only, no deployment) | none |
| `test` | `build-preview-apk.yml`: on push, `eas build --profile preview` (EAS channel `preview`) | Preview APK |
| `production-2` | `build-production-apk.yml`: on push, `eas build --profile production` (channel `production`) | Production APK |
| `main` | `build-production-apk.yml`: on push to `main`, production profile | Production APK (legacy trigger; treat `main` as a production branch) |

The app has no database. The API it calls is set by `EXPO_PUBLIC_API_URL` in the EAS
environment (`preview` / `production`); verify that value before a build (not verified on 2026-11-03). Any OLMIES API it reaches uses
the shared main OLMIES database (see olmies-ai AGENTS.md).
Pushing to `production-2` or `main` builds a production app and is covered by "Production
protection". Over-the-air updates are off unless code-signed (`docs/security/OTA_UPDATE_SIGNING.md`).

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

> **Owner only.** AI coding agents must not carry out this section (see "Production protection"). It is kept as the owner's reference procedure.

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
production-2 = production APK build (owner-authorized actions only)
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
  * keep `.github/workflows/build-preview-apk.yml` only

* `production-2`:
  * keep `.github/workflows/build-production-apk.yml` only

* `main`:
  * also carries `build-production-apk.yml` (triggers on push to `main`)

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
