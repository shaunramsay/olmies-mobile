# Over-the-air updates (SC-31)

OTA updates are **off** unless they are code-signed (`src/utils/updatePolicy.js`, applied in
`app.config.js`). CI fails if the production configuration would accept an unsigned update.

## Turning signed updates on (needs a UTech decision on who approves releases)

1. The release approver generates the key pair on their own machine, outside the repository:
   `npx expo-updates codesigning:generate --key-output-directory keys --certificate-output-directory certs --certificate-validity-duration-years 2 --certificate-common-name "UTech Campus Companion"`
2. Commit only `certs/certificate.pem`. `keys/` is git-ignored and must stay with the approver.
3. Build a new binary (the certificate is embedded at build time; existing installs keep OTA off).
4. Publish updates with `eas update --private-key-path keys/private-key.pem`.

Without the certificate, ship changes through a new reviewed build. A non-production build can
use unsigned updates for internal testing only with `OLMIES_ALLOW_UNSIGNED_UPDATES=true`.

Distribution (side-loaded APK versus Google Play or Intune) is a separate UTech decision.
