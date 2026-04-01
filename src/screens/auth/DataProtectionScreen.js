import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

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
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                {isManualReview && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close-outline" size={28} color={colors.text} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: colors.text, marginLeft: isManualReview ? 15 : 0 }]}>
                    Data Protection Policy
                </Text>
            </View>

            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}1A` }]}>
                    <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
                </View>
                
                <Text style={[styles.title, { color: colors.text }]}>Privacy & Data Protection</Text>
                
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                    In compliance with the Data Protection Act of Jamaica, we want to ensure you understand how your data is collected, used, and stored within the Olmies application.
                </Text>
                
                <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        Olmies does not store personal passwords. We operate a "stateless" identity model by verifying your Moodle JWT credentials. The only data we actively collect from your device is an anonymized "Device ID" and an Expo Push Token to send you academic alerts. We retrieve read-only enrollment data straight from the university ISAS database.
                    </Text>
                    
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Third-Party Data Processors</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        To provide advanced functionality, Olmies utilizes third-party infrastructure. Your written survey feedback is processed by OpenAI's API to generate qualitative summaries for administration. Your primary responses and Expo Tokens are securely hosted using Supabase's managed Postgres databases. Your notifications are securely routed via the Expo messaging infrastructure.
                    </Text>
                    
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Security & Your Rights</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        All data transmitted between your device and our APIs is heavily encrypted in transit. Because Olmies acts as an extension for the university's core ISAS and Moodle data, any requests for complete erasure of your central academic identity records should be directed to the University's official IT or Data Protection Officer.
                    </Text>
                </View>
                <View style={{height: 40}} />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                {!isManualReview ? (
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        By continuing, you acknowledge that you have read and agree to the policies outlined above.
                    </Text>
                ) : null}
                
                <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleAccept}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>
                        {isManualReview ? "Close" : "I Understand and Accept"}
                    </Text>
                </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingVertical: Platform.OS === 'android' ? 20 : 15,
        borderBottomWidth: 1,
        elevation: 2,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 30,
    },
    section: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionBody: {
        fontSize: 14,
        lineHeight: 22,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
    },
    disclaimer: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
