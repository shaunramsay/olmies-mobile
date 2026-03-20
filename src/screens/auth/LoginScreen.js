import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
        setErrorMsg('Please enter your Moodle username.');
        return;
    }
    setErrorMsg('');

    setIsLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
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
            await login(data.token, data.user);
            
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
            {errorMsg ? <Text style={{color: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)', padding: 10, borderRadius: 8, marginBottom: 15, fontWeight: 'bold'}}>{errorMsg}</Text> : null}
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
