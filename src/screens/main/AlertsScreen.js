import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import FullscreenImageViewer from '../../components/FullscreenImageViewer';
import NotificationDetailModal from '../../components/NotificationDetailModal';
import { EmptyState, ScreenHeader } from '../../components/ui';
import { fonts, radii, shadow, spacing } from '../../utils/theme';
import API_BASE_URL from '../../config/api';
const { isVisibleNotification } = require('../../utils/notificationVisibility');

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl || trimmedUrl === 'null') return null;
  if (trimmedUrl.startsWith('http')) return trimmedUrl;
  return `${API_BASE_URL}${trimmedUrl}`;
};

export default function AlertsScreen({ navigation }) {
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchAnnouncements = async () => {
        setLoading(true);
        try {
          const res = await fetchWithAuth('/api/v1/campushub/notifications');
          if (res.ok) {
            const data = await res.json();
            // Map backend schema to UI format.
            const mapped = data.filter(isVisibleNotification).map(notification => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              imageUrl: resolveImageUrl(notification.imageUrl),
              date: new Date(notification.createdAt).toLocaleString(),
              fullDate: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Recently',
              type: notification.type,
              read: notification.isRead
            }));
            setAlerts(mapped);
          }
        } catch (err) {
          console.error('Failed to fetch announcements:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAnnouncements();
    }, [user, fetchWithAuth])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Notifications" subtitle="Campus alerts, events and service updates." />
        <View style={styles.topRightActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          {user ? (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginLeft: 8 }]} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={17} color={colors.textSecondary} />
             </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : alerts.length === 0 ? (
          <EmptyState icon="notifications-outline" title="You're all caught up" message="You have no new notifications." />
        ) : (
          alerts.map(alert => {
            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  !isDarkTheme && shadow.card,
                  !alert.read && { backgroundColor: colors.accentTint, borderColor: colors.accent },
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedAlert(alert)}
              >
                <View style={styles.iconContainer}>
                  {alert.imageUrl ? (
                    <Image source={{ uri: alert.imageUrl }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={[styles.notificationPlaceholder, { backgroundColor: colors.primaryTint, borderColor: colors.border }]}>
                      <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
                    </View>
                  )}
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>{alert.title}</Text>
                    {!alert.read && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
                  </View>
                  <Text style={[styles.alertDate, { color: colors.textSecondary }]}>{alert.date}</Text>
                  <Text style={[styles.alertMessage, { color: colors.textSecondary }]} numberOfLines={2}>{alert.message}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <NotificationDetailModal
        visible={!!selectedAlert}
        notification={selectedAlert}
        colors={colors}
        isDarkTheme={isDarkTheme}
        onClose={() => setSelectedAlert(null)}
        onOpenImage={setFullscreenImage}
      />

      <FullscreenImageViewer
        visible={!!fullscreenImage}
        imageUrl={fullscreenImage?.imageUrl}
        title={fullscreenImage?.title}
        onClose={() => setFullscreenImage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  alertCard: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  alertTitle: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
    flexShrink: 1,
  },
  alertDate: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    marginTop: 2,
  },
  alertMessage: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginTop: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
});
