import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  // Mock alerts data for scaffolding
  const alerts = [
    {
      id: '1',
      title: 'Course Evaluation Reminder',
      message: 'Your evaluation for INT4020 is due by the end of the week. Please complete it to unlock early grades.',
      date: 'Today, 9:00 AM',
      type: 'warning',
      read: false
    },
    {
      id: '2',
      title: 'Campus Wi-Fi Maintenance',
      message: 'The main campus Wi-Fi network will undergo scheduled maintenance this Saturday from 2:00 AM to 4:00 AM.',
      date: 'Yesterday, 2:30 PM',
      type: 'info',
      read: true
    },
    {
      id: '3',
      title: 'New Survey Available',
      message: 'A new campus-wide survey regarding the cafeteria menu is now available. Your feedback is appreciated!',
      date: 'Oct 10, 11:15 AM',
      type: 'survey',
      read: true
    }
  ];

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
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {alerts.map(alert => {
          const icon = getIconForType(alert.type);
          return (
            <TouchableOpacity 
              key={alert.id} 
              style={[styles.alertCard, !alert.read && styles.unreadCard]}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={icon.name} size={24} color={icon.color} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertTitle, !alert.read && styles.unreadText]}>{alert.title}</Text>
                  <Text style={styles.alertDate}>{alert.date}</Text>
                </View>
                <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
              </View>
              {!alert.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  },
  scrollContent: {
    padding: 15,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
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
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    flex: 1,
    marginRight: 10,
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
  }
});
