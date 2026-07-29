import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL, { buildApiUrl } from '../../config/api';
import { useAppTheme } from '../../context/ThemeContext';
import { Button, Card } from '../../components/ui';
import { brand, fonts, radii, spacing } from '../../utils/theme';

const UTECH_CREST = require('../../../assets/utech-crest.png');

const demoAccounts = [
  { label: 'Student', icon: 'school-outline', username: 'test_student', password: 'student123' },
  { label: 'Lecturer', icon: 'briefcase-outline', username: 'test_lecturer', password: 'lecturer123' }
];

const INVALID_LOGIN_MESSAGE = 'Invalid username or password. Please try again.';
const INVALID_DEMO_LOGIN_MESSAGE = 'Invalid demo credentials. Please use the Student or Lecturer demo buttons.';
const NETWORK_ERROR_MESSAGE = 'Unable to reach the login service. Please check your connection and try again.';

export default function LoginScreen({ navigation }) {
  const { login, getDeviceId } = useAuth();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 860;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        const endpoint = isTestAccount ? '/api/v1/auth/testing/login' : '/api/v1/auth/login';
        const response = await fetch(buildApiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Parse safely to prevent "Unexpected end of input" crashes on empty responses
        const rawText = await response.text();
        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (parseError) {
            if (__DEV__) {
                console.warn('Login response was not valid JSON.', {
                    status: response.status,
                    endpoint,
                    rawText,
                    parseError
                });
            }
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
            if (__DEV__) {
                console.warn('Login failed.', {
                    status: response.status,
                    endpoint,
                    response: data
                });
            }

            setErrorMsg(isTestAccount && showDemoAccounts ? INVALID_DEMO_LOGIN_MESSAGE : INVALID_LOGIN_MESSAGE);
        }
    } catch (error) {
        setErrorMsg(NETWORK_ERROR_MESSAGE);
        if (__DEV__) {
            console.error("Login fetch error:", {
                error,
                apiBaseUrl: API_BASE_URL
            });
        }
    } finally {
        setIsLoading(false);
    }
  };

  const fillDemoAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setErrorMsg('');
  };

  const formCard = (
    <Card style={styles.formCard} elevated>
      <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in with your University credentials to continue.</Text>

      {errorMsg ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerTint }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {showDemoAccounts ? (
        <View style={[styles.demoBanner, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
          <Text style={[styles.demoBannerText, { color: colors.accentInk }]}>
            <Text style={{ fontFamily: fonts.bold }}>Demo accounts — </Text>
            tap one below to autofill a student or lecturer login.
          </Text>
          <View style={styles.demoAccountGrid}>
            {demoAccounts.map((account) => (
              <TouchableOpacity
                key={account.username}
                style={[styles.demoAccountButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => fillDemoAccount(account)}
                disabled={isLoading}
              >
                <Ionicons name={account.icon} size={16} color={colors.primary} />
                <Text style={[styles.demoAccountText, { color: colors.text }]}>{account.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={[styles.label, { color: colors.text }]}>Username</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
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
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
          />
          <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIconContainer}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
              <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color={colors.textSecondary}
              />
          </TouchableOpacity>
      </View>

      <Button
        label="Sign In"
        onPress={handleLogin}
        loading={isLoading}
        fullWidth
        style={styles.submitButton}
      />
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWide ? brand.navy : colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={isWide ? styles.scrollWide : styles.scrollNarrow}>
          {isWide ? (
            <View style={styles.splitRow}>
              <View style={styles.brandPanel}>
                <View style={styles.brandRing} />
                <TouchableOpacity style={styles.backButtonWide} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.brandRow}>
                  <View style={styles.crestBadge}>
                    <Image source={UTECH_CREST} style={styles.crest} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={styles.brandName}>UTech, Jamaica</Text>
                    <Text style={styles.brandSub}>Olmies · Campus Companion</Text>
                  </View>
                </View>
                <View style={styles.brandCopy}>
                  <Text style={styles.brandHeadline}>Your campus voice starts here.</Text>
                  <Text style={styles.brandBody}>
                    Evaluations, alerts and campus services — signed in with the credentials you already have.
                  </Text>
                  <View style={styles.protectedPill}>
                    <Ionicons name="shield-checkmark-outline" size={13} color={brand.gold} />
                    <Text style={styles.protectedText}>Protected by UTech data-protection policy</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.formPanel, { backgroundColor: colors.background }]}>{formCard}</View>
            </View>
          ) : (
            <View style={styles.narrowWrap}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={26} color={colors.text} />
              </TouchableOpacity>
              {formCard}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollWide: { flexGrow: 1 },
  scrollNarrow: { flexGrow: 1, justifyContent: 'center' },
  splitRow: { flex: 1, flexDirection: 'row', minHeight: 640 },
  brandPanel: {
    flex: 1.1,
    backgroundColor: brand.navy,
    padding: 44,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  brandRing: {
    position: 'absolute',
    right: -60,
    top: '30%',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 30,
    borderColor: 'rgba(255,210,1,0.12)',
  },
  backButtonWide: {
    width: 36, height: 36, borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  crestBadge: {
    width: 46, height: 46, borderRadius: radii.pill, backgroundColor: brand.gold,
    alignItems: 'center', justifyContent: 'center', padding: 8,
  },
  crest: { width: '100%', height: '100%' },
  brandName: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 },
  brandSub: { color: brand.onNavySecondary, fontFamily: fonts.semiBold, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 },
  brandCopy: { maxWidth: 380 },
  brandHeadline: { color: '#FFFFFF', fontFamily: fonts.extraBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  brandBody: { color: brand.onNavySecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: 12 },
  protectedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: brand.goldTint, borderRadius: radii.pill,
    paddingVertical: 7, paddingHorizontal: 13, marginTop: 18,
  },
  protectedText: { color: brand.gold, fontFamily: fonts.bold, fontSize: 11.5 },
  formPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  narrowWrap: { padding: 24, width: '100%' },
  formCard: { width: '100%', maxWidth: 380, alignSelf: 'center', padding: 26 },
  backButton: { marginBottom: 24, width: 40 },
  title: { fontSize: 24, fontFamily: fonts.extraBold, marginBottom: 4, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, marginBottom: 18 },
  errorBanner: { borderRadius: radii.sm, padding: 10, marginBottom: 14 },
  errorText: { fontFamily: fonts.bold, fontSize: 12.5 },
  demoBanner: { borderWidth: 1, borderRadius: radii.md, padding: 12, marginBottom: 16 },
  demoBannerText: { fontFamily: fonts.regular, fontSize: 11.5, marginBottom: 10, lineHeight: 16 },
  demoAccountGrid: { flexDirection: 'row', gap: 10 },
  demoAccountButton: {
    flex: 1, minHeight: 42, borderRadius: radii.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7,
  },
  demoAccountText: { fontSize: 12.5, fontFamily: fonts.bold },
  label: { fontSize: 11.5, fontFamily: fonts.bold, marginBottom: 6, marginTop: 13 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radii.md,
    borderWidth: 1.5, paddingHorizontal: 13, height: 46,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, fontFamily: fonts.regular },
  submitButton: { marginTop: 22, paddingVertical: 13 },
  eyeIconContainer: { padding: 8, marginRight: -4, justifyContent: 'center', alignItems: 'center' },
});
