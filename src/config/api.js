import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically grab the laptop's Wi-Fi IP address automatically assigned by Expo (e.g., 192.168.5.206)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
// Physical phones CANNOT use 'localhost' to reach the laptop's backend!
// Forcefully override Expo's dynamic adapter detection to the exact active Wi-Fi IPv4 address
const overrideIp = '192.168.5.206';
const defaultApiUrl = `http://${overrideIp}:5000`;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? defaultApiUrl : 'https://olmies-ai-production.up.railway.app');

export default API_BASE_URL;
