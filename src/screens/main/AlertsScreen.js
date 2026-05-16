import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import FullscreenImageViewer from '../../components/FullscreenImageViewer';
import NotificationDetailModal from '../../components/NotificationDetailModal';
import API_BASE_URL from '../../config/api';

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl || trimmedUrl === 'null') return null;
  if (trimmedUrl.startsWith('http')) return trimmedUrl;
  return `${API_BASE_URL}${trimmedUrl}`;
};

const isVisibleNotification = (notification) => {
  const status = String(notification?.status || '').toLowerCase();
  return status === 'sent' || status === 'published';
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Ionicons name="notifications-outline" size={28} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.topRightActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {user ? (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={18} color={colors.textSecondary} />
             </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 40 }} />
        ) : alerts.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>You have no new notifications.</Text>
        ) : (
          alerts.map(alert => {
            return (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }, !alert.read && { backgroundColor: `${colors.primary}1A`, borderColor: colors.primary }]}
                activeOpacity={0.7}
                onPress={() => setSelectedAlert(alert)}
              >
                <View style={styles.iconContainer}>
                  {alert.imageUrl ? (
                    <Image source={{ uri: alert.imageUrl }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={[styles.notificationPlaceholder, { backgroundColor: `${colors.primary}24`, borderColor: `${colors.primary}66` }]}>
                      <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                    </View>
                  )}
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.text }, !alert.read && { color: colors.primary, fontWeight: 'bold' }]}>{alert.title}</Text>
                  <Text style={[styles.alertDate, { color: colors.textSecondary }]}>{alert.date}</Text>
                  <Text style={[styles.alertMessage, { marginTop: 8, color: colors.textSecondary }]} numberOfLines={2}>{alert.message}</Text>
                </View>
                {!alert.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <NotificationDetailModal
        visible={!!selectedAlert}
        notification={selectedAlert}
        colors={colors}
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
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 15,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  unreadCard: {
    backgroundColor: '#1d1a24',
    borderColor: '#372054',
  },
  iconContainer: {
    width: 44,
    height: 44,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 4,
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alertDate: {
    fontSize: 12,
    color: '#666',
  },
  alertMessage: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginLeft: 10,
  },
});
