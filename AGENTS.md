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

## Git branch management, synchronization and promotion (owner policy, 2026-11-04)

This policy is mandatory for every contributor and agent. It exists to prevent four things: work on
stale branches, accidental promotion, unnecessary deployments and lost work. The lifecycle is:

**Develop → Verify → Synchronize `dev` → Approve promotion → Merge into `test` → Deploy → Verify →
Approve production release.**

### Branch model

* **`dev`: active development.** `dev` is the authoritative integration branch.
  * After approved work is committed and pushed, local `dev` matches `origin/dev`.
  * Work happens on `dev`, or on a short-lived branch created from an up-to-date `dev`.
  * Every completed fix or feature is merged into `dev` before it is promoted.
  * A temporary branch must not turn into a separate, forgotten line of development.
* **`test`: integration and UAT.** `test` holds approved code that is ready for integration testing.
  * A push to `origin/test` runs that repository's TEST workflow: a Railway TEST deployment for
    olmies-ai and ISAS.IntegrationAPI, and a preview APK build for olmies-mobile.
  * Local `test` tracks `origin/test` and is synchronized before every promotion.
  * Application changes reach `test` only through a controlled merge from `dev`, or through an
    approved pull request.
  * No routine development happens on `test`.
  * TEST-specific workflows and configuration are preserved.
* **Production: approved releases only.** Production branch names differ by repository; see
  "This repository".
  * Production receives only tested releases that have been explicitly authorized ("Production
    protection" applies in full).
  * `test` is never promoted to production automatically.
  * Existing production branch names and deployment procedures stay as they are until they are
    separately reviewed and approved.
* Each long-lived branch (`dev`, `test` and the production branch) has a local counterpart that
  tracks the remote branch. Temporary local branches need no remote counterpart.
* `dev` and `test` are not expected to have identical commit hashes or identical workflow files.
  What must hold is that all approved `dev` application code is contained in `test`.

### Workspaces and repositories

* olmies-ai, olmies-mobile and ISAS.IntegrationAPI are independent Git repositories.
  Synchronizing one does not synchronize the others.
* Work may happen on the owner's Mac or Windows computer, or in a cloud agent workspace. Keep
  these four things distinct:
  * the owner's local branch;
  * the cloud workspace branch;
  * the GitHub branch;
  * the commit actually deployed to TEST.
* Changes made in one workspace never appear in another by themselves. They arrive only through a
  verified push and fetch.
* When a release involves more than one repository, record each repository's commit SHA and any
  compatibility dependency between them (for example, mobile `EXPO_PUBLIC_API_URL` and an API
  endpoint or contract).

### Mandatory preflight before changing code

1. Identify the repository and the workspace (owner's computer or cloud workspace, and its path).
2. Read this file, and any other repository instructions that apply.
3. Record the current branch and the working-tree status.
4. Fetch remote references (`git fetch origin`) when authentication and connectivity allow.
5. Compare local and remote, both ahead/behind counts and ancestry:
   * `git rev-list --left-right --count <branch>...origin/<branch>`
   * `git merge-base --is-ancestor`
6. Identify uncommitted, untracked and ignored files that the work could affect.
7. Confirm that the branch you intend to work on is current. If it is clean and only behind, update
   it with `git pull --ff-only` or a fast-forward fetch.
8. **Stop and report** any of the following:
   * unexpected divergence;
   * missing commits;
   * authentication failures;
   * anything that could lose local work.

* Never resolve divergence silently by force-pushing, resetting, rebasing or overwriting files.
* If GitHub cannot be reached, say plainly that remote synchronization is **unverified**. Stale
  remote-tracking references are not the current GitHub state. GitHub may still be read
  another way, for example in an authenticated browser; if so, state the source.
* Read-only work may continue. Code changes that depend on a verified baseline wait until the
  problem is resolved, or until the owner explicitly authorizes them.
* olmies-ai's "Mandatory Git Synchronization Check" gives the command sequence for `dev`.

### Mandatory completion procedure (before calling work complete)

* Run the relevant automated tests.
* Review the changed files and the scope of the commit.
* Check for credentials, tokens, passwords, private keys, connection strings or other secrets. Run
  `scripts/security/scan-secrets.py` where the repository has it.
* Confirm that no deployment workflow or environment configuration was changed unintentionally.
* Confirm that the commit is on the intended branch.
* Report the commit SHA and the local versus remote status.
* Push only when the current task explicitly authorizes it. A commit counts as published only after
  the push has succeeded and the remote branch has been checked.

### Mandatory `dev` → `test` promotion procedure

1. Fetch and verify the latest remote references.
2. Confirm that local `dev` is the intended `origin/dev` commit, and that local `test` is the
   intended `origin/test` commit.
3. List the exact commits and files being promoted, for example with `git log` and
   `git diff --stat` between `origin/test` and `origin/dev`.
4. Confirm that every change is approved for promotion. Check for unrelated changes, secrets, and
   changes to workflow files.
5. Confirm that the relevant CI runs and tests have passed.
6. Preserve the TEST workflow. On a workflow conflict, keep the target branch's file (see
   "Workflow File Rules").
7. Write a promotion readiness report and obtain **explicit authorization** before merging into or
   pushing `test`. Note that pushing `test` deploys.
8. Promote with a merge commit, or with an approved pull request. Never copy application files
   between branches by hand in place of a merge. Never squash or rebase shared history.
9. After promotion, confirm that every approved `dev` application change is contained in `test`.
   Two checks:
   * `git diff origin/dev origin/test` shows only the environment-specific files.
   * `origin/dev` is an ancestor of `origin/test`.

### Deployment verification (after an authorized push to `origin/test`)

* Confirm that the expected workflow run started, and that it succeeded.
* Confirm that the deployment or preview build matches the intended commit.
* Run the API, integration, portal or mobile smoke tests that fit the change.
* Report the deployment status, the commit tested, the test results and any open issues.
* A successful push is not a successful deployment.
* Keep the existing Railway TEST arrangements for olmies-ai and ISAS.IntegrationAPI, and the preview
  APK workflow for olmies-mobile.

### Temporary branches (`fix/*`, `promote/*`, `security/*`, cloud-workspace branches)

* Create temporary branches when they are needed. Do not create or push redundant remote branches.
* Before deleting a temporary branch:
  * confirm that the changes it needs are contained in the intended long-lived branch;
  * check it for unique commits and for uncommitted changes;
  * confirm that the deletion affects only the intended workspace.
* Deleting a branch the owner created, on the owner's computer or on GitHub, requires the owner's
  approval. This rule overrides the deletion steps in any cleanup checklist in this file: those
  steps identify the branches and propose deleting them.

### Security and environment protection

* Never commit secrets. Keep credentials in approved secret stores, or in protected local files
  outside Git. Keep the `.gitignore` protections.
* Never show secret values in reports.
* Never force-push a shared or protected branch.
* Never change production infrastructure without explicit authorization.
* Never trigger a deployment only to synchronize a branch. Fast-forward local branches instead,
  which deploys nothing.
* Never change an environment-specific workflow to make `dev` and `test` look identical.

### Reporting format (synchronization and promotion)

For each repository and workspace, report:

* the current branch;
* the local SHA and the remote SHA, with the source of the remote SHA (fresh fetch, or other);
* ahead/behind counts;
* the working-tree status;
* the changes made;
* the tests and security checks run;
* the deployment impact;
* any remaining discrepancies and approvals still needed.

Mark verified facts separately from assumptions and from stale information.

## Databases

Never assume two services are isolated because their environment names differ. Running in
Development does not establish database isolation. Before any deployment or administrative
database mutation, verify the actual database target and all connected environments. Migrations,
seeding, fixture provisioning, synthetic identity creation, schema resets and other administrative
data changes require explicit project-owner authorization for their scope and cross-environment
effects. Starting an application that may execute these paths requires the same review; shared
database access or an environment label is not authorization. Never put credentials or connection
strings in this file.

Credential rotation or synchronization across environments requires an explicitly approved,
coordinated process covering all affected consumers, change order and verification. A credential
mismatch does not itself authorize changing a secret, connection string or hosting configuration.

## Intentional Shared Supabase Database — Project Owner Decision (6 November 2026)

This is the project owner's explicit architectural decision for the current synthetic-data
arrangement. It governs the architecture where earlier wording conflicts with it; it does not
waive existing approval requirements or production protections. Database and operational
instructions below are reconciled with this decision; all other safeguards remain in force.

1. The project owner deliberately configured OLMIES development and Railway TEST to use a
   common Supabase data source. This provides one consistent source of truth for synthetic
   application data across development, testing and demonstrations.
2. The shared database is intentional. Do not classify database sharing itself as an accidental
   misconfiguration or automatically recommend database separation as a required security
   remediation.
3. All application data in the current development and demonstration environments is
   owner-declared synthetic. This does not eliminate the need to protect credentials, database
   integrity, access controls or application security.
4. The legacy Azure Production configuration may also reference the same Supabase project.
   Azure Production remains stopped and must not be restarted, modified or deployed to without
   explicit project-owner authorization.
5. Do not create separate databases, change database connection strings, migrate data, reset
   schemas, perform destructive operations or alter Railway/Azure configuration without explicit
   project-owner approval.
6. Shared database access does not imply that migrations, fixture provisioning, synthetic
   identity creation or seeding may execute automatically. Such operations must be governed by
   explicit safeguards and reviewed for their effect on all connected environments.
7. The existing `Database__IsolatedFromProduction=true` setting must not be interpreted as proof
   of physical database isolation. Its operational consequences require separate review. Do not
   change it without examining dependencies and obtaining project-owner approval.
8. Future institutional Production deployment involving real UTech data requires a separately
   approved architecture, appropriate isolation, institutional security controls and EAS
   authorization. The current shared synthetic-data arrangement does not authorize using the
   same database for live institutional records.
9. Security remediation must preserve the owner's single-source-of-truth design while
   eliminating genuine vulnerabilities. If a proposed correction conflicts with this decision,
   stop and present alternatives rather than silently redesigning the infrastructure.

## Data classification (confirmed by the project owner, 2026-11-03)

* All current OLMIES application data is owner-declared synthetic: development, TEST, demonstration and
  Azure Production data, including surveys, responses, student enrolments, lecturer
  assignments and modules. Never describe these records as real institutional records.
* Azure Production is a protected, stopped legacy synthetic demonstration environment,
  despite its name. It must not be restarted, modified or deployed to without explicit
  project-owner authorization. Its "Production protection" rules and deliberate version
  difference from TEST must be preserved.
* Synthetic data does not relax anything else. Development and Railway TEST intentionally
  share a common Supabase data source. Review migrations, schema changes and writes for their
  effect on every connected environment; sharing alone does not require database separation.
  Authentication, authorization, database integrity and credential protection stay fully in force.
* Authentication tokens, passwords, API keys, connection strings and server logs are genuine
  operational information, not synthetic data. Protect them accordingly.
* Before any integration brings in real UTech student or staff data (for example live ISAS or
  Entra ID sign-in for real users), reassess this classification and get the owner's approval.

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
| `dev` | `security-ci.yml` (tests and secret scan on push and pull requests; no deployment) | none |
| `test` | `build-preview-apk.yml`: on push, `eas build --profile preview` (EAS channel `preview`) | Preview APK |
| `production-2` | `build-production-apk.yml`: on push, `eas build --profile production` (channel `production`) | Production APK |
| `main` | `build-production-apk.yml`: on push to `main`, production profile | Production APK (legacy trigger; treat `main` as a production branch) |

The app has no database. The API it calls is set by `EXPO_PUBLIC_API_URL` in the EAS
environment (`preview` / `production`); verify that value before a build (not verified on 2026-11-03). Any OLMIES API it reaches uses
the shared main OLMIES database (see olmies-ai AGENTS.md).
Pushing to `production-2` or `main` builds a production app and is covered by "Production
protection". Over-the-air updates are off unless code-signed (`docs/security/OTA_UPDATE_SIGNING.md`).

# OLMIES Standard Git Workflow

> These commands are the owner's reference sequence. Agents follow "Git branch management,
> synchronization and promotion" above: preflight first, fast-forward-only updates, and push or
> promote only when the current task explicitly authorizes it.

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
* Azure Production is a protected, stopped legacy synthetic demonstration environment;
  restart, modification or deployment requires explicit project-owner authorization.
* Railway production is legacy/stale and should not be used for normal deployment verification.

# Purpose

This workflow exists to keep:

* environments predictable
* deployments controlled
* testing controlled without assuming database isolation
* production safe
