import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically grab the laptop's Wi-Fi IP address automatically assigned by Expo (e.g., 192.168.5.206)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
const CLOUD_WIFI_IP = debuggerHost.split(':')[0];

// Physical phones CANNOT use 'localhost' to reach the laptop's backend! They will just talk to themselves.
const defaultApiUrl = (Platform.OS === 'web' || !CLOUD_WIFI_IP) 
    ? 'http://localhost:5000' 
    : `http://${CLOUD_WIFI_IP}:5000`;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://olmies-ai-production.up.railway.app';

export default API_BASE_URL;
