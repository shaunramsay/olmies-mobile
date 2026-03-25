import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

export default function AlertsScreen() {
  const { fetchWithAuth } = useAuth();
  const { isDarkTheme, toggleTheme } = useAppTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetchWithAuth('/api/v1/mobile/announcements');
        if (res.ok) {
          const data = await res.json();
          // Map backend schema to UI format.
          const mapped = data.map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            message: announcement.message,
            imageUrl: announcement.imageUrl,
            date: new Date(announcement.createdAt).toLocaleString(),
            type: announcement.targetAudience === 'Global' ? 'info' : 'survey',
            read: false // Simple mock for now
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
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case 'warning': return { name: 'alert-circle', color: '#ffb74d' };
      case 'survey': return { name: 'clipboard', color: '#8A2BE2' };
      default: return { name: 'information-circle', color: '#64b5f6' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#8A2BE2" style={{ marginTop: 40 }} />
        ) : alerts.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>You have no new notifications.</Text>
        ) : (
          alerts.map(alert => {
            const icon = getIconForType(alert.type);
            return (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.alertCard, !alert.read && styles.unreadCard]}
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
                  <Text style={[styles.alertTitle, !alert.read && styles.unreadText]}>{alert.title}</Text>
                  <Text style={styles.alertDate}>{alert.date}</Text>
                  <Text style={[styles.alertMessage, { marginTop: 8 }]} numberOfLines={2}>{alert.message}</Text>
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
  themeToggle: {
    padding: 8,
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
    backgroundColor: '#8A2BE2',
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
    backgroundColor: '#8A2BE2',
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
