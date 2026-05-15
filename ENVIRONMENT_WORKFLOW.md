# Environment Workflow

This mobile app should get its API URL from the environment that built it. Do not hard-code Railway, Azure, or future UTech-hosted URLs in `eas.json`.

In this repo, `main` is the release-candidate branch for APKs. The `production` EAS profile means "build the APK we would hand to users" and should point to Azure production unless and until an official UTech API host replaces it. When UTech provides the final API host, update the EAS `production` environment variables and rebuild from `main`.

Active API lanes:

- Railway test: `https://olmies-ai-test.up.railway.app`
- Azure production: `https://olmies-api-8294.azurewebsites.net`

Railway production, including `https://olmies-ai-production.up.railway.app`, is legacy/stale and is not an active mobile API target. Do not point preview or production builds at it unless the team explicitly decides to revive that Railway environment.

## Environments

| Build profile | EAS environment | API target |
| --- | --- | --- |
| Local Expo | local `.env.local` | Local API, usually `http://localhost:5000` for web or the LAN host for devices |
| `preview` | `preview` | Railway test API |
| `production` | `production` | Azure production API; later, official UTech API |

## Required EAS Variables

Set these variables in EAS for both `preview` and `production`:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

The values must differ by environment:

- `preview` points to Railway test.
- `production` points to Azure production until UTech provides the final host.
- neither environment should point to legacy Railway production.

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
