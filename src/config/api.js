import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically grab the laptop's Wi-Fi IP address automatically assigned by Expo
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
const CLOUD_WIFI_IP = debuggerHost.split(':')[0];

// Physical phones CANNOT use 'localhost' to reach the laptop's backend!
const overrideIp = '192.168.5.206';
const useIp = CLOUD_WIFI_IP || overrideIp;

// Allow an explicit env override first. Otherwise, keep production for web and use
// the LAN-hosted backend in Expo/native development for faster local recovery.
const localApiUrl = Platform.OS === 'web'
  ? 'http://localhost:5000'
  : `http://${useIp}:5000`;
const defaultApiUrl = __DEV__
  ? localApiUrl
  : 'https://olmies-ai-helpdesk.azurewebsites.net';



// Ensure Expo cache is cleared (expo start -c) when modifying .env variables!
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;

export default API_BASE_URL;
