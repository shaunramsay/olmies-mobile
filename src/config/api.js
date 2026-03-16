import Constants from 'expo-constants';

// We fall back to the localhost URL matching the web app
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
