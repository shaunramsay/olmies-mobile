# Environment Workflow

This mobile app should get its API URL from the environment that built it. Do not hard-code Railway or Azure URLs in `eas.json`.

## Environments

| Build profile | EAS environment | API target |
| --- | --- | --- |
| Local Expo | local `.env.local` | Local API, usually `http://localhost:5000` for web or the LAN host for devices |
| `preview` | `preview` | Railway test API |
| `production` | `production` | Azure production API |

## Required EAS Variables

Set these variables in EAS for both `preview` and `production`:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

The values must differ by environment:

- `preview` points to Railway test.
- `production` points to Azure production.

## Daily Process

1. Work locally with `.env.local`.
2. Commit locally on `dev`.
3. Merge `dev` into `test`.
4. Push `test` only when the corresponding API/admin Railway test environment is ready.
5. Build mobile preview with `eas build --profile preview`.
6. Build production only after Railway test is accepted and production API settings are confirmed.
