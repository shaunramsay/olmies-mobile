import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function AlertsScreen() {
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchAnnouncements = async () => {
        setLoading(true);
        try {
          const res = await fetchWithAuth('/api/v1/campushub/notifications');
          if (res.ok) {
            const data = await res.json();
            // Map backend schema to UI format.
            const mapped = data.map(notification => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              imageUrl: notification.imageUrl,
              date: new Date(notification.createdAt).toLocaleString(),
              type: notification.type === 'Academic' ? 'warning' : (notification.type === 'Promo' ? 'survey' : 'info'),
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

  const getIconForType = (type) => {
    switch (type) {
      case 'warning': return { name: 'alert-circle', color: '#ffb74d' };
      case 'survey': return { name: 'clipboard', color: '#4A90E2' };
      default: return { name: 'information-circle', color: '#64b5f6' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Ionicons name="notifications-outline" size={28} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.topRightActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
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
            const icon = getIconForType(alert.type);
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
                    <Ionicons name={icon.name} size={24} color={icon.color} />
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

      {/* Full Notification Modal */}
      <Modal visible={!!selectedAlert} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlert?.imageUrl && (
              <Image source={{ uri: selectedAlert.imageUrl }} style={styles.modalImage} resizeMode="cover" />
            )}
            <View style={styles.modalTextContainer}>
              <Text style={styles.modalTitle}>{selectedAlert?.title}</Text>
              <Text style={styles.modalDate}>{selectedAlert?.date}</Text>
              <ScrollView style={styles.modalMessageBody}>
                <Text style={styles.modalMessage}>{selectedAlert?.message}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedAlert(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginRight: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalImage: {
    width: '100%',
    height: 220,
  },
  modalTextContainer: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  modalMessageBody: {
    maxHeight: 250,
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
