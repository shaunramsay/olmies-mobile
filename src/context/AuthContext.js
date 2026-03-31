import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import API_BASE_URL from '../config/api';

const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

// Safely init notifications only if we are outside of Expo Go
if (Platform.OS !== 'web' && !isExpoGo) {
    try {
        const Notifications = require('expo-notifications');
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (e) { 
        console.warn('Push handled safely outside Expo Go', e); 
    }
}

const AuthContext = createContext(null);
const TOKEN_KEY = 'olmies_mobile_token';

// Polyfill secure storage for Web usage
const TokenStorage = {
    getItemAsync: async (key) => {
        if (Platform.OS === 'web') return localStorage.getItem(key);
        return await SecureStore.getItemAsync(key);
    },
    setItemAsync: async (key, value) => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        return await SecureStore.setItemAsync(key, value);
    },
    deleteItemAsync: async (key) => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return await SecureStore.deleteItemAsync(key);
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAcceptedDPA, setHasAcceptedDPA] = useState(null);

    // Initial load of the token from SecureStore or Web Storage
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await TokenStorage.getItemAsync(TOKEN_KEY);
                const dpaAccepted = await TokenStorage.getItemAsync('olmies_dpa_accepted');
                
                if (dpaAccepted === 'true') {
                    setHasAcceptedDPA(true);
                } else {
                    setHasAcceptedDPA(false);
                }

                if (storedToken) {
                    setToken(storedToken);
                    decodeAndSetUser(storedToken);
                }
            } catch (error) {
                console.error('Error loading config:', error);
                setHasAcceptedDPA(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadToken();
    }, []);

    const acceptDPA = async () => {
        try {
            await TokenStorage.setItemAsync('olmies_dpa_accepted', 'true');
            setHasAcceptedDPA(true);
        } catch (error) {
            console.error('Failed to secure save DPA consent:', error);
        }
    };

    const decodeAndSetUser = (jwt, explicitUserData = null) => {
        try {
            const payload = jwtDecode(jwt);
            const decoded = {
                id: payload.sub,
                username: payload.username || 'User',
                role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                isSuperAdmin: payload.SuperAdmin === 'true',
                permissions: payload.Permission || []
            };
            setUser(decoded);
            return decoded;
        } catch (e) {
            console.warn("Invalid JWT format detected. Assuming Mock Backend Token...", jwt);
            if (explicitUserData) {
                setUser(explicitUserData);
                return explicitUserData;
            } else {
                const fallback = { username: 'Test User', role: 'Student' };
                setUser(fallback);
                return fallback;
            }
        }
    };

    const registerForPushNotificationsAsync = async (currentUser) => {
        if (Platform.OS === 'web' || !Device.isDevice || isExpoGo) return;

        const Notifications = require('expo-notifications');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) return;

            const tokenObj = await Notifications.getExpoPushTokenAsync({ projectId });
            
            // Send to our backend
            if (tokenObj && tokenObj.data && currentUser?.username) {
                await fetchWithAuth('/api/v1/mobile/tokens', {
                    method: 'POST',
                    body: JSON.stringify({
                        Username: currentUser.username,
                        ExpoToken: tokenObj.data
                    })
                });
            }
        } catch (error) {
            console.error('Error fetching Expo token:', error);
        }
    };

    const login = async (newToken, userData = null) => {
        try {
            await TokenStorage.setItemAsync(TOKEN_KEY, newToken);
            setToken(newToken);
            const decodedUser = decodeAndSetUser(newToken, userData);
            
            // Fire and forget push token registration on successful login
            if (decodedUser) {
                registerForPushNotificationsAsync(decodedUser);
            }
        } catch (error) {
           console.error('Failed to securely save token:', error);
        }
    };

    const logout = async () => {
        try {
            await TokenStorage.deleteItemAsync(TOKEN_KEY);
            setToken(null);
            setUser(null);
        } catch(error) {
            console.error('Failed to delete secure token:', error);
        }
    };

    // Helper method wrapper around fetch to inject bearer token
    const fetchWithAuth = async (url, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        const headers = { ...options.headers };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        headers['Content-Type'] = options.headers && options.headers['Content-Type'] ? options.headers['Content-Type'] : 'application/json';

        const response = await fetch(fullUrl, { ...options, headers });
        if (response.status === 401 && token) {
            logout(); // Auto logout on 401 Unauthorized only if we had an expired token
        }
        return response;
    };

    const getDeviceId = async () => {
        let storedId = await TokenStorage.getItemAsync('olmies_device_id');
        if (!storedId) {
            storedId = Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
            await TokenStorage.setItemAsync('olmies_device_id', storedId);
        }
        return storedId;
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, logout, fetchWithAuth, getDeviceId, hasAcceptedDPA, acceptDPA }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
