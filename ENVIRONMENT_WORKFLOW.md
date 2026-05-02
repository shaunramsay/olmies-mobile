# Environment Workflow

This mobile app should get its API URL from the environment that built it. Do not hard-code Railway, Azure, or future UTech-hosted URLs in `eas.json`.

In this repo, `main` is the release-candidate branch for APKs. The `production` EAS profile means "build the APK we would hand to users from the final development lane"; it does not assume the permanent UTech hosting target already exists. When UTech provides the final API host, update the EAS `production` environment variables and rebuild from `main`.

## Environments

| Build profile | EAS environment | API target |
| --- | --- | --- |
| Local Expo | local `.env.local` | Local API, usually `http://localhost:5000` for web or the LAN host for devices |
| `preview` | `preview` | Railway test API |
| `production` | `production` | Current release-candidate API; later, official UTech API |

## Required EAS Variables

Set these variables in EAS for both `preview` and `production`:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

The values must differ by environment:

- `preview` points to Railway test.
- `production` points to the current release-candidate API until UTech provides the final host.

## APK Automation

`.github/workflows/build-production-apk.yml` starts an EAS Android APK build whenever `main` receives changes. It can also be run manually from GitHub Actions.

Required GitHub secret:

- `EXPO_TOKEN`

The production APK build uses:

- branch: `main`
- EAS profile: `production`
- EAS environment: `production`
- Android output: APK
- Android version code: auto-incremented by EAS

## Daily Process

1. Work locally with `.env.local`.
2. Commit locally on `dev`.
3. Merge `dev` into `test`.
4. Push `test` only when the corresponding API/admin Railway test environment is ready.
5. Build mobile preview with `eas build --profile preview`.
6. Merge accepted mobile changes into `main`.
7. Push `main` to trigger the production-profile APK build.
8. When UTech provides final hosting, update only the EAS `production` variables and build again from `main`.
