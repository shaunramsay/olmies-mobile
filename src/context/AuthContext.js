import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import API_BASE_URL from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AuthContext = createContext(null);
const TOKEN_KEY = 'olmies_token';

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

    // Initial load of the token from SecureStore or Web Storage
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await TokenStorage.getItemAsync(TOKEN_KEY);
                if (storedToken) {
                    setToken(storedToken);
                    decodeAndSetUser(storedToken);
                }
            } catch (error) {
                console.error('Error loading token:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadToken();
    }, []);

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
        if (Platform.OS === 'web' || !Device.isDevice) return;

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
        
        const headers = {
            ...options.headers,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': options.headers && options.headers['Content-Type'] ? options.headers['Content-Type'] : 'application/json'
        };

        const response = await fetch(fullUrl, { ...options, headers });
        if (response.status === 401) {
            logout(); // Auto logout on 401 Unauthorized
        }
        return response;
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, logout, fetchWithAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
