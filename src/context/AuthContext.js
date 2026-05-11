import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Alert, AppState, Linking, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import API_BASE_URL from '../config/api';
import { installGoogleDirectionsProxy } from '../config/googleDirectionsProxy';

const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
const CAMPUS_ALERTS_CHANNEL_ID = 'campus-alerts';
const PUSH_PERMISSION_PROMPTED_AT_KEY = 'olmies_push_permission_prompted_at';
const PUSH_PERMISSION_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const PUSH_DIAGNOSTICS_JS_MARKER = 'push-diagnostics-v1-startup-registration';

const getUpdatesModule = () => {
    try {
        return require('expo-updates');
    } catch (e) {
        return null;
    }
};

const formatUpdateDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    return String(value);
};

const getPushRuntimeInfo = () => {
    const Updates = getUpdatesModule();
    const expoConfig = Constants?.expoConfig || {};
    const easConfig = Constants?.easConfig || {};

    return {
        appName: expoConfig?.name ?? null,
        appVersion: expoConfig?.version ?? Constants?.manifest?.version ?? null,
        runtimeVersion: Updates?.runtimeVersion ?? expoConfig?.runtimeVersion ?? null,
        updateChannel: Updates?.channel ?? null,
        updateId: Updates?.updateId ?? null,
        updateCreatedAt: formatUpdateDate(Updates?.createdAt),
        isEmbeddedLaunch: Updates?.isEmbeddedLaunch ?? null,
        updateUrl: expoConfig?.updates?.url ?? null,
        projectId: expoConfig?.extra?.eas?.projectId ?? easConfig?.projectId ?? null,
        apiBaseUrl: API_BASE_URL || null,
        platform: Platform.OS,
        isDevice: Device.isDevice,
        isExpoGo,
    };
};

const shouldEnablePushDiagnostics = () => {
    const runtimeInfo = getPushRuntimeInfo();
    const channel = runtimeInfo.updateChannel || '';
    const apiBaseUrl = runtimeInfo.apiBaseUrl || '';
    const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;

    return Boolean(
        isDevelopment ||
        channel === 'preview' ||
        apiBaseUrl.includes('olmies-ai-test.up.railway.app')
    );
};

const buildInitialPushDiagnostics = () => ({
    enabled: shouldEnablePushDiagnostics(),
    jsMarker: PUSH_DIAGNOSTICS_JS_MARKER,
    startupRegistrationCodePresent: true,
    lastStep: 'waiting_for_startup_registration',
    lastAttemptAt: null,
    lastEventAt: null,
    notificationsModuleAvailable: false,
    androidChannelCreated: null,
    androidChannelError: null,
    permissionStatus: null,
    permissionGranted: null,
    permissionCanAskAgain: null,
    permissionRequestAttempted: false,
    expoTokenAttempted: false,
    expoToken: null,
    expoTokenError: null,
    backendTokenPostAttempted: false,
    backendTokenPostStatus: null,
    backendTokenPostOk: null,
    backendTokenPostError: null,
    backendTokenPostResponse: null,
    deviceId: null,
    username: null,
    skipReason: null,
    lastError: null,
    events: [],
    ...getPushRuntimeInfo(),
});

const getErrorMessage = (error) => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    return error?.message || JSON.stringify(error);
};

const compactDiagnosticValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value.length > 140 ? `${value.slice(0, 140)}...` : value;
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    try {
        const serialized = JSON.stringify(value);
        return serialized.length > 140 ? `${serialized.slice(0, 140)}...` : serialized;
    } catch (error) {
        return String(value);
    }
};

const getNotificationsModule = () => {
    if (Platform.OS === 'web' || isExpoGo) return null;

    try {
        return require('expo-notifications');
    } catch (e) {
        console.warn('Push notifications module unavailable in this runtime:', e);
        return null;
    }
};

// Safely init notifications only if we are outside of Expo Go
const Notifications = getNotificationsModule();
if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
        handleError: (notificationId, error) => {
            console.warn('Failed to present incoming push notification:', notificationId, error);
        },
    });
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
    const [pushDiagnostics, setPushDiagnostics] = useState(buildInitialPushDiagnostics);

    const recordPushDiagnostic = (step, patch = {}, level = 'info') => {
        const eventAt = new Date().toISOString();
        const event = {
            at: eventAt,
            step,
            detail: Object.entries(patch)
                .map(([key, value]) => `${key}: ${compactDiagnosticValue(value)}`)
                .join(', '),
        };
        const runtimeInfo = getPushRuntimeInfo();
        const payload = {
            step,
            at: eventAt,
            ...runtimeInfo,
            ...patch,
        };
        const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
        logger('[PushDiagnostics]', payload);

        setPushDiagnostics((previous) => ({
            ...previous,
            ...runtimeInfo,
            ...patch,
            enabled: previous?.enabled ?? shouldEnablePushDiagnostics(),
            jsMarker: PUSH_DIAGNOSTICS_JS_MARKER,
            startupRegistrationCodePresent: true,
            lastStep: step,
            lastEventAt: eventAt,
            events: [event, ...(previous?.events || [])].slice(0, 10),
        }));
    };

    useEffect(() => {
        installGoogleDirectionsProxy(() => token);
    }, [token]);

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

                let decodedUser = null;
                if (storedToken) {
                    setToken(storedToken);
                    decodedUser = decodeAndSetUser(storedToken);
                }

                registerForPushNotificationsAsync(decodedUser);
            } catch (error) {
                console.error('Error loading config:', error);
                setHasAcceptedDPA(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadToken();
    }, []);

    useEffect(() => {
        const Notifications = getNotificationsModule();
        if (!Notifications) return undefined;

        const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
            const content = notification?.request?.content;
            console.info('Received OS push notification:', {
                title: content?.title,
                body: content?.body,
                data: content?.data,
            });
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const content = response?.notification?.request?.content;
            console.info('Opened OS push notification:', {
                title: content?.title,
                body: content?.body,
                data: content?.data,
            });
        });

        return () => {
            receivedSubscription?.remove?.();
            responseSubscription?.remove?.();
        };
    }, []);

    const acceptDPA = async () => {
        try {
            await TokenStorage.setItemAsync('olmies_dpa_accepted', 'true');
            setHasAcceptedDPA(true);
        } catch (error) {
            console.error('Failed to secure save DPA consent:', error);
        }
    };

    const logPushPermissionStatus = (label, permission) => {
        console.info(`Push notification permission status (${label}):`, {
            status: permission?.status,
            granted: permission?.granted,
            canAskAgain: permission?.canAskAgain,
        });
        recordPushDiagnostic(`permission_${label.replace(/\s+/g, '_')}`, {
            permissionStatus: permission?.status ?? null,
            permissionGranted: permission?.granted ?? null,
            permissionCanAskAgain: permission?.canAskAgain ?? null,
        });
    };

    const showPushPermissionSettingsPrompt = async (currentUser) => {
        try {
            const lastPromptedAt = await TokenStorage.getItemAsync(PUSH_PERMISSION_PROMPTED_AT_KEY);
            const lastPromptedTime = Number(lastPromptedAt);
            const canShowPrompt = !lastPromptedTime || Date.now() - lastPromptedTime > PUSH_PERMISSION_PROMPT_COOLDOWN_MS;

            if (!canShowPrompt) {
                console.info('Push notification settings prompt skipped: recently shown.');
                recordPushDiagnostic('settings_prompt_skipped_cooldown', {
                    lastSettingsPromptAt: lastPromptedAt || null,
                }, 'warn');
                return;
            }

            await TokenStorage.setItemAsync(PUSH_PERMISSION_PROMPTED_AT_KEY, String(Date.now()));
            recordPushDiagnostic('settings_prompt_shown', {
                username: currentUser?.username ?? null,
            });
        } catch (error) {
            console.warn('Unable to save push notification settings prompt state:', error);
            recordPushDiagnostic('settings_prompt_state_error', {
                lastError: getErrorMessage(error),
            }, 'warn');
        }

        Alert.alert(
            'Turn on OLMIES notifications',
            'OLMIES needs notification permission so you can receive campus alerts and survey updates when they are deployed.',
            [
                { text: 'Not Now', style: 'cancel' },
                {
                    text: 'Open Settings',
                    onPress: () => {
                        let handledSettingsReturn = false;
                        let settingsSubscription;
                        settingsSubscription = AppState.addEventListener('change', (nextState) => {
                            if (nextState === 'active' && !handledSettingsReturn) {
                                handledSettingsReturn = true;
                                settingsSubscription?.remove?.();
                                registerForPushNotificationsAsync(currentUser);
                            }
                        });

                        Linking.openSettings().catch((error) => {
                            settingsSubscription?.remove?.();
                            console.warn('Unable to open notification settings:', error);
                            recordPushDiagnostic('open_settings_failed', {
                                lastError: getErrorMessage(error),
                            }, 'error');
                        });
                    },
                },
            ]
        );
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
        const lastAttemptAt = new Date().toISOString();
        recordPushDiagnostic('registration_started', {
            lastAttemptAt,
            username: currentUser?.username ?? null,
            skipReason: null,
            lastError: null,
            androidChannelCreated: null,
            androidChannelError: null,
            permissionStatus: null,
            permissionGranted: null,
            permissionCanAskAgain: null,
            permissionRequestAttempted: false,
            expoTokenAttempted: false,
            expoToken: null,
            expoTokenError: null,
            backendTokenPostAttempted: false,
            backendTokenPostStatus: null,
            backendTokenPostOk: null,
            backendTokenPostError: null,
            backendTokenPostResponse: null,
        });

        if (Platform.OS === 'web' || !Device.isDevice) {
            console.info('Push registration skipped: physical mobile device required.');
            recordPushDiagnostic('registration_skipped_device', {
                skipReason: 'Physical mobile device required',
            }, 'warn');
            return;
        }

        if (isExpoGo) {
            console.info('Push registration skipped: remote push notifications require a development or production build, not Expo Go.');
            recordPushDiagnostic('registration_skipped_expo_go', {
                skipReason: 'Remote push notifications require a development or production build, not Expo Go',
            }, 'warn');
            return;
        }

        const Notifications = getNotificationsModule();
        recordPushDiagnostic('notifications_module_checked', {
            notificationsModuleAvailable: !!Notifications,
        });
        if (!Notifications) {
            recordPushDiagnostic('registration_skipped_notifications_module_missing', {
                skipReason: 'expo-notifications native module unavailable',
            }, 'error');
            return;
        }

        if (Platform.OS === 'android') {
            recordPushDiagnostic('android_channel_create_attempted', {
                androidChannelId: CAMPUS_ALERTS_CHANNEL_ID,
            });
            try {
                await Notifications.setNotificationChannelAsync(CAMPUS_ALERTS_CHANNEL_ID, {
                    name: 'Campus Alerts',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#0055A4',
                    sound: 'default',
                });
                recordPushDiagnostic('android_channel_created', {
                    androidChannelCreated: true,
                    androidChannelError: null,
                });
            } catch (error) {
                recordPushDiagnostic('android_channel_create_failed', {
                    androidChannelCreated: false,
                    androidChannelError: getErrorMessage(error),
                    lastError: getErrorMessage(error),
                }, 'error');
                return;
            }
        } else {
            recordPushDiagnostic('android_channel_skipped', {
                androidChannelCreated: null,
            });
        }

        let existingPermission;
        try {
            recordPushDiagnostic('permission_check_attempted');
            existingPermission = await Notifications.getPermissionsAsync();
            logPushPermissionStatus('before request', existingPermission);
        } catch (error) {
            recordPushDiagnostic('permission_check_failed', {
                lastError: getErrorMessage(error),
            }, 'error');
            return;
        }

        let finalPermission = existingPermission;
        if (existingPermission.status === 'undetermined') {
            try {
                recordPushDiagnostic('permission_request_attempted', {
                    permissionRequestAttempted: true,
                });
                finalPermission = await Notifications.requestPermissionsAsync();
                logPushPermissionStatus('after request', finalPermission);
            } catch (error) {
                recordPushDiagnostic('permission_request_failed', {
                    permissionRequestAttempted: true,
                    lastError: getErrorMessage(error),
                }, 'error');
                return;
            }
        } else {
            recordPushDiagnostic('permission_request_skipped', {
                permissionRequestAttempted: false,
                permissionRequestSkippedReason: `status is ${existingPermission.status}`,
            });
        }

        if (finalPermission.status !== 'granted') {
            console.warn('Push registration skipped: notification permission was not granted.');
            recordPushDiagnostic('registration_skipped_permission_not_granted', {
                permissionStatus: finalPermission?.status ?? null,
                permissionGranted: finalPermission?.granted ?? null,
                permissionCanAskAgain: finalPermission?.canAskAgain ?? null,
                skipReason: 'Notification permission was not granted',
            }, 'warn');
            await showPushPermissionSettingsPrompt(currentUser);
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            recordPushDiagnostic('project_id_resolved', {
                projectId: projectId ?? null,
            });
            if (!projectId) {
                console.warn('Push registration skipped: Expo EAS projectId is missing.');
                recordPushDiagnostic('registration_skipped_missing_project_id', {
                    skipReason: 'Expo EAS projectId is missing',
                }, 'error');
                return;
            }

            recordPushDiagnostic('expo_token_request_attempted', {
                expoTokenAttempted: true,
            });
            const tokenObj = await Notifications.getExpoPushTokenAsync({ projectId });
            recordPushDiagnostic('expo_token_request_completed', {
                expoTokenAttempted: true,
                expoToken: tokenObj?.data ?? null,
                expoTokenError: tokenObj?.data ? null : 'No token data returned',
            }, tokenObj?.data ? 'info' : 'warn');
            
            // Send to our backend
            if (tokenObj && tokenObj.data) {
                const deviceId = await getDeviceId();
                const requestBody = {
                    ExpoToken: tokenObj.data,
                    DeviceId: deviceId,
                    Platform: Platform.OS,
                    AppVersion: Constants?.expoConfig?.version ?? Constants?.manifest?.version ?? null,
                };

                if (currentUser?.username) {
                    requestBody.Username = currentUser.username;
                }

                recordPushDiagnostic('backend_token_post_attempted', {
                    backendTokenPostAttempted: true,
                    backendTokenPostEndpoint: '/api/v1/mobile/tokens',
                    deviceId,
                    username: currentUser?.username ?? null,
                });
                const response = await fetchWithAuth('/api/v1/mobile/tokens', {
                    method: 'POST',
                    body: JSON.stringify(requestBody)
                });
                const responseText = await response.text().catch(() => '');

                if (!response.ok) {
                    console.warn('Failed to register Expo push token with API:', response.status, responseText);
                    recordPushDiagnostic('backend_token_post_failed', {
                        backendTokenPostAttempted: true,
                        backendTokenPostStatus: response.status,
                        backendTokenPostOk: false,
                        backendTokenPostError: responseText || `HTTP ${response.status}`,
                        backendTokenPostResponse: responseText || null,
                    }, 'warn');
                } else {
                    recordPushDiagnostic('backend_token_post_succeeded', {
                        backendTokenPostAttempted: true,
                        backendTokenPostStatus: response.status,
                        backendTokenPostOk: true,
                        backendTokenPostError: null,
                        backendTokenPostResponse: responseText || null,
                    });
                    console.info('Registered Expo push token for OS notifications:', {
                        expoToken: tokenObj.data,
                        username: currentUser?.username ?? null,
                        deviceId,
                        platform: Platform.OS,
                    });
                }
            } else {
                recordPushDiagnostic('registration_stopped_no_expo_token', {
                    skipReason: 'No Expo token was returned',
                }, 'warn');
            }
        } catch (error) {
            console.error('Error fetching Expo token:', error);
            recordPushDiagnostic('registration_failed', {
                expoTokenError: getErrorMessage(error),
                lastError: getErrorMessage(error),
            }, 'error');
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
        
        // Prevent manual Content-Type overrides from breaking the auto-generated FormData boundary hashes natively.
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        } else if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

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

    const retryPushRegistration = async () => {
        recordPushDiagnostic('manual_retry_requested', {
            username: user?.username ?? null,
        });
        return registerForPushNotificationsAsync(user);
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, logout, fetchWithAuth, getDeviceId, hasAcceptedDPA, acceptDPA, pushDiagnostics, retryPushRegistration }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
