const baseConfig = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';

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
  extra: {
    ...(baseConfig.expo.extra || {}),
    apiBaseUrl,
    googleMapsApiKey,
  },
};
