import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const formatValue = (value) => {
  if (value == null || value === '') return 'Not available';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const formatBackendStatus = (diagnostics) => {
  if (!diagnostics?.backendTokenPostAttempted) return 'Not attempted';
  if (diagnostics.backendTokenPostStatus) {
    return `${diagnostics.backendTokenPostStatus}${diagnostics.backendTokenPostOk ? ' OK' : ' failed'}`;
  }
  return diagnostics.backendTokenPostError || 'Attempted, no status yet';
};

const formatPermission = (diagnostics) => {
  if (!diagnostics?.permissionStatus) return 'Not checked';
  const granted = diagnostics.permissionGranted ? 'granted' : 'not granted';
  const canAsk = diagnostics.permissionCanAskAgain == null
    ? 'canAskAgain unknown'
    : diagnostics.permissionCanAskAgain
      ? 'can ask again'
      : 'cannot ask again';
  return `${diagnostics.permissionStatus} (${granted}, ${canAsk})`;
};

export default function PushDiagnosticsPanel() {
  const { pushDiagnostics, retryPushRegistration } = useAuth();
  const { colors } = useAppTheme();

  if (!pushDiagnostics?.enabled) return null;

  const rows = [
    ['JS marker', pushDiagnostics.jsMarker],
    ['Startup code', pushDiagnostics.startupRegistrationCodePresent ? 'Present' : 'Missing'],
    ['API URL', pushDiagnostics.apiBaseUrl],
    ['Channel', pushDiagnostics.updateChannel],
    ['Runtime', pushDiagnostics.runtimeVersion],
    ['Update ID', pushDiagnostics.updateId || (pushDiagnostics.isEmbeddedLaunch ? 'Embedded bundle' : null)],
    ['Update created', pushDiagnostics.updateCreatedAt],
    ['Update URL', pushDiagnostics.updateUrl],
    ['Project ID', pushDiagnostics.projectId],
    ['Package platform', `${formatValue(pushDiagnostics.platform)} / physical device: ${formatValue(pushDiagnostics.isDevice)}`],
    ['Expo Go', pushDiagnostics.isExpoGo],
    ['Last attempt', pushDiagnostics.lastAttemptAt],
    ['Last step', pushDiagnostics.lastStep],
    ['Permission', formatPermission(pushDiagnostics)],
    ['Android channel', pushDiagnostics.androidChannelCreated ? 'Created' : pushDiagnostics.androidChannelError || 'Not confirmed'],
    ['Token attempted', pushDiagnostics.expoTokenAttempted],
    ['Expo token', pushDiagnostics.expoToken || pushDiagnostics.expoTokenError],
    ['Backend attempted', pushDiagnostics.backendTokenPostAttempted],
    ['Backend status', formatBackendStatus(pushDiagnostics)],
    ['Backend response', pushDiagnostics.backendTokenPostResponse || pushDiagnostics.backendTokenPostError],
    ['Device ID', pushDiagnostics.deviceId],
    ['Username', pushDiagnostics.username || 'Anonymous'],
    ['Skip reason', pushDiagnostics.skipReason],
    ['Last error', pushDiagnostics.lastError],
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bug-outline" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Push Diagnostics</Text>
        </View>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={retryPushRegistration}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={14} color={colors.primary} />
          <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Preview-only status for the real Expo push registration path.
      </Text>

      <ScrollView style={styles.rows} nestedScrollEnabled>
        {rows.map(([label, value]) => (
          <View key={label} style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.value, { color: colors.text }]} selectable>
              {formatValue(value)}
            </Text>
          </View>
        ))}

        <View style={styles.eventsBlock}>
          <Text style={[styles.eventsTitle, { color: colors.textSecondary }]}>Recent events</Text>
          {(pushDiagnostics.events || []).length === 0 ? (
            <Text style={[styles.eventText, { color: colors.textSecondary }]}>No events recorded yet.</Text>
          ) : (
            pushDiagnostics.events.map((event, index) => (
              <Text
                key={`${event.at}-${event.step}-${index}`}
                style={[styles.eventText, { color: colors.textSecondary }]}
                selectable
              >
                {event.at} - {event.step}{event.detail ? ` - ${event.detail}` : ''}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 8,
  },
  rows: {
    maxHeight: 280,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 12,
    lineHeight: 17,
  },
  eventsBlock: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  eventsTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  eventText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
});
