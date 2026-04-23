import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Prefer an explicit env var, but keep a LAN fallback for quick local Expo sessions.
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
const lanHost = debuggerHost.split(':')[0];

const localApiUrl = Platform.select({
  web: 'http://localhost:5000',
  android: lanHost ? `http://${lanHost}:5000` : 'http://10.0.2.2:5000',
  ios: lanHost ? `http://${lanHost}:5000` : 'http://localhost:5000',
  default: 'http://localhost:5000',
});
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiBaseUrl || '';
const API_BASE_URL = configuredApiUrl || (__DEV__ ? localApiUrl : '');

export default API_BASE_URL;
