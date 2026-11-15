import Constants from 'expo-constants';
import { Platform } from 'react-native';
const { evaluateApiBaseUrl, resolveApiRequestUrl } = require('./apiDestinationPolicy');

// Prefer an explicit env var, but keep a LAN fallback for quick local Expo sessions.
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
const lanHost = debuggerHost.split(':')[0];

const localApiUrl = Platform.select({
  web: 'http://localhost:5000',
  android: lanHost ? `http://${lanHost}:5000` : 'http://10.0.2.2:5000',
  ios: lanHost ? `http://${lanHost}:5000` : 'http://localhost:5000',
  default: 'http://localhost:5000',
});
const normalizeApiBaseUrl = (value) => {
  const trimmedValue = (value || '').trim();

  if (!trimmedValue || trimmedValue === 'undefined' || trimmedValue === 'null') {
    return '';
  }

  return trimmedValue.replace(/\/+$/, '');
};

const configuredApiUrl = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiBaseUrl || ''
);

// PROV-07: credentials and tokens are only ever sent to an approved destination. Release builds
// (not __DEV__) accept only an HTTPS origin in apiDestinationApprovals.json; development builds may
// also use a loopback or private-LAN API. A refused destination leaves API_BASE_URL empty, so every
// request fails before anything is sent.
const apiDestination = evaluateApiBaseUrl(configuredApiUrl || (__DEV__ ? normalizeApiBaseUrl(localApiUrl) : ''), {
  release: !__DEV__,
});
export const API_DESTINATION_ERROR = apiDestination.ok ? null : apiDestination.reason;
const API_BASE_URL = apiDestination.ok ? apiDestination.baseUrl : '';

if (API_DESTINATION_ERROR && __DEV__) {
  console.warn(`API destination refused: ${API_DESTINATION_ERROR}`);
}

export const buildApiUrl = (path) => resolveApiRequestUrl(API_BASE_URL, path);

export default API_BASE_URL;
