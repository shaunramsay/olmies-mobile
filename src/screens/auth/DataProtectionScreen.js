import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, IconChip } from '../../components/ui';
import { fonts, spacing } from '../../utils/theme';

export default function DataProtectionScreen({ navigation, route }) {
    const { colors } = useAppTheme();
    const { acceptDPA } = useAuth();

    // If accessed manually from Hub via navigation stack rather than the initial gate blocking
    const isManualReview = route?.params?.isReviewMode;

    const handleAccept = async () => {
        if (!isManualReview) {
            await acceptDPA();
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
                {isManualReview && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close-outline" size={26} color={colors.text} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: colors.text, marginLeft: isManualReview ? 12 : 0 }]}>
                    Data Protection Policy
                </Text>
            </View>

            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconRow}>
                    <IconChip name="shield-checkmark-outline" tone="navy" size={64} iconSize={28} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Privacy &amp; Data Protection</Text>

                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                    In compliance with the Data Protection Act of Jamaica, we want to ensure you understand how your data is collected, used, and stored within Campus Companion.
                </Text>

                <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        Campus Companion does not store personal passwords. We operate a "stateless" identity model by verifying your Moodle JWT credentials. The only data we actively collect from your device is an anonymized "Device ID" and an Expo Push Token to send you academic alerts. We retrieve read-only enrollment data straight from the university ISAS database.
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Third-Party Data Processors</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        To provide advanced functionality, Campus Companion utilizes third-party infrastructure. Your written survey feedback is processed by OpenAI's API to generate qualitative summaries for administration. Your primary responses and Expo Tokens are securely hosted using Supabase's managed Postgres databases. Your notifications are securely routed via the Expo messaging infrastructure.
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Security &amp; Your Rights</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        All data transmitted between your device and our APIs is heavily encrypted in transit. Because Campus Companion acts as an extension for the university's core ISAS and Moodle data, any requests for complete erasure of your central academic identity records should be directed to the University's official IT or Data Protection Officer.
                    </Text>
                </Card>
                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
                {!isManualReview ? (
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        By continuing, you acknowledge that you have read and agree to the policies outlined above.
                    </Text>
                ) : null}

                <Button
                    label={isManualReview ? 'Close' : 'I Understand and Accept'}
                    onPress={handleAccept}
                    fullWidth
                    style={styles.primaryButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: Platform.OS === 'android' ? 20 : 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
    },
    iconRow: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontFamily: fonts.extraBold,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    bodyText: {
        fontSize: 14,
        lineHeight: 21,
        fontFamily: fonts.regular,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14.5,
        fontFamily: fonts.bold,
        marginBottom: 8,
    },
    sectionBody: {
        fontSize: 13.5,
        lineHeight: 21,
        fontFamily: fonts.regular,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    disclaimer: {
        fontSize: 11.5,
        fontFamily: fonts.regular,
        textAlign: 'center',
        marginBottom: 14,
        maxWidth: 480,
    },
    primaryButton: {
        maxWidth: 480,
        paddingVertical: 14,
    },
});
