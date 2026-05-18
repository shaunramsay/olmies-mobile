import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL, { buildApiUrl } from '../../config/api';
import { useAppTheme } from '../../context/ThemeContext';

const demoAccounts = [
  { label: 'Student', icon: 'school-outline', username: 'test_student', password: 'student123' },
  { label: 'Lecturer', icon: 'briefcase-outline', username: 'test_lecturer', password: 'lecturer123' }
];

export default function LoginScreen({ navigation }) {
  const { login, getDeviceId } = useAuth();
  const { colors } = useAppTheme();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const showDemoAccounts =
    __DEV__ ||
    process.env.EXPO_PUBLIC_ENABLE_DEMO_LOGIN === 'true' ||
    API_BASE_URL.includes('olmies-ai-test');

  const handleLogin = async () => {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
        setErrorMsg('Please enter your Moodle username.');
        return;
    }
    setErrorMsg('');

    setIsLoading(true);

    try {
        const isTestAccount = normalizedUsername === 'test_student' || normalizedUsername === 'test_lecturer';
        const requestBody = isTestAccount
            ? { username: normalizedUsername, password }
            : {
                username: normalizedUsername,
                password,
                deviceId: await getDeviceId()
            };

        const response = await fetch(buildApiUrl(isTestAccount ? '/api/v1/auth/testing/login' : '/api/v1/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Parse safely to prevent "Unexpected end of input" crashes on empty responses
        const rawText = await response.text();
        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (e) {
            throw new Error(`Invalid JSON Response (Status ${response.status}): ${rawText}`);
        }

        if (response.ok && data.token) {
            // Successfully retrieved the JWT token, save it via Context
            await login(data.token, data.user, data.refreshToken);
            
            // Pop the Login modal to return to previous screen
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.replace('Main');
            }
        } else {
            setErrorMsg(`HTTP ${response.status} - ${JSON.stringify(data)}`);
        }
    } catch (error) {
        setErrorMsg(`Network Error: ${error.message} - Using URL: ${API_BASE_URL}`);
        console.error("Login fetch error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const fillDemoAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setErrorMsg('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in with your University credentials to continue.</Text>
        </View>

        <View style={styles.form}>
            {errorMsg ? <Text style={{color: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)', padding: 10, borderRadius: 8, marginBottom: 15, fontWeight: 'bold'}}>{errorMsg}</Text> : null}
            {showDemoAccounts ? (
              <View style={styles.demoAccountSection}>
                <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>Demo Accounts</Text>
                <View style={styles.demoAccountGrid}>
                  {demoAccounts.map((account) => (
                    <TouchableOpacity
                      key={account.username}
                      style={[styles.demoAccountButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => fillDemoAccount(account)}
                      disabled={isLoading}
                    >
                      <Ionicons name={account.icon} size={18} color={colors.primary} />
                      <Text style={[styles.demoAccountText, { color: colors.text }]}>{account.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter ID number"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput 
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>


            <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Sign In</Text>
                )}
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginTop: Platform.OS === 'android' ? 20 : 0,
    marginBottom: 30,
    width: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  demoAccountSection: {
    marginBottom: 8,
  },
  demoAccountGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  demoAccountButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  demoAccountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  }
});
