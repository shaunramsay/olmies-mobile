const baseConfig = require('./app.json');
const { resolveUpdates } = require('./src/utils/updatePolicy');
const { evaluateApiBaseUrl, isReleaseBuildEnvironment } = require('./src/config/apiDestinationPolicy');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// PROV-07: an EAS preview/production build must target an approved HTTPS API. A missing, retired
// or unapproved destination fails the build here instead of shipping an app that sends
// credentials to the wrong host. Local tooling (expo start, expo config) is not blocked; the app
// itself refuses unapproved destinations at runtime as well (src/config/api.js).
const releaseBuild = isReleaseBuildEnvironment(process.env);
const apiDestination = evaluateApiBaseUrl(process.env.EXPO_PUBLIC_API_URL, { release: releaseBuild });
if (releaseBuild && !apiDestination.ok) {
  throw new Error(`Refusing to configure a release build: ${apiDestination.reason}`);
}
const apiBaseUrl = apiDestination.ok ? apiDestination.baseUrl : '';

module.exports = {
  ...baseConfig.expo,
  ios: {
    ...baseConfig.expo.ios,
    config: {
      ...(baseConfig.expo.ios?.config || {}),
      googleMapsApiKey,
    },
  },
  android: {
    ...baseConfig.expo.android,
    config: {
      ...(baseConfig.expo.android?.config || {}),
      googleMaps: {
        ...(baseConfig.expo.android?.config?.googleMaps || {}),
        apiKey: googleMapsApiKey,
      },
    },
  },
  // SC-31: OTA updates only when code-signed; otherwise disabled.
  updates: resolveUpdates(baseConfig.expo.updates),
  extra: {
    ...(baseConfig.expo.extra || {}),
    apiBaseUrl,
    googleMapsApiKey,
  },
};
