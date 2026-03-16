import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Normally required, backend might just mock it atm
  const [role, setRole] = useState('Student'); // Default
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
        Alert.alert('Required', 'Please enter your Moodle username.');
        return;
    }

    setIsLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Successfully retrieved the JWT token, save it via Context
            // We pass the raw data.user object because the backend currently emits a mock token that cannot be decoded.
            await login(data.token, data.user);
            // We don't need to manually navigate to MainStack; AppNavigator will detect the token change automatically.
        } else {
            Alert.alert('Login Failed', data.error || 'Invalid credentials');
        }
    } catch (error) {
        Alert.alert('Network Error', `Could not connect to the authentication server at ${API_BASE_URL}. Error: ${error.message}`);
        console.error("Login fetch error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in with your University credentials to continue.</Text>
        </View>

        <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder="Enter ID number"
                    placeholderTextColor="#555"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#555"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {/* Quick role toggle for MVP testing with the backend Mock Token generator */}
            <Text style={styles.label}>Sign in as (Development)</Text>
            <View style={styles.roleToggle}>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'Student' && styles.roleButtonActive]}
                    onPress={() => setRole('Student')}
                >
                    <Text style={[styles.roleText, role === 'Student' && styles.roleTextActive]}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'Lecturer' && styles.roleButtonActive]}
                    onPress={() => setRole('Lecturer')}
                >
                    <Text style={[styles.roleText, role === 'Lecturer' && styles.roleTextActive]}>Lecturer</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
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
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#333',
  },
  roleText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#8A2BE2',
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
