import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';

export default function InsightsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { isDarkTheme, toggleTheme } = useAppTheme();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="stats-chart" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Survey Insights</Text>
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
            <Ionicons name="lock-closed" size={80} color="#222" style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 }}>Insights Locked</Text>
            <Text style={{ fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 30, lineHeight: 24 }}>
                Sign in with your University credentials to unlock your academic performance insights and sentiment data.
            </Text>
            <TouchableOpacity 
                style={{ backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('Login')}
            >
                <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Sign In</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Survey Insights</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
           <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Campus Pulse Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Campus Pulse</Text>
          <Text style={styles.cardSubtitle}>General satisfaction based on latest campus surveys.</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>4.2</Text>
              <Text style={styles.metricLabel}>/ 5.0</Text>
              <Text style={styles.metricTitle}>Overall Satisfaction</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>85%</Text>
              <Text style={styles.metricLabel}>Participation</Text>
              <Text style={styles.metricTitle}>Student Engagement</Text>
            </View>
          </View>
        </View>

        {/* Module Ratings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Module Ratings</Text>
          <Text style={styles.cardSubtitle}>Aggregated sentiment from modules you are participating in.</Text>
          
          <View style={styles.moduleMetric}>
            <View style={styles.moduleHeaderRow}>
              <Text style={styles.moduleCode}>INT4020</Text>
              <View style={styles.badgePositive}>
                <Text style={styles.badgeText}>Positive (4.5)</Text>
              </View>
            </View>
            <Text style={styles.moduleSnippet}>"Students appreciate the practical lab sessions..."</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.moduleMetric}>
            <View style={styles.moduleHeaderRow}>
              <Text style={styles.moduleCode}>CMP3011</Text>
              <View style={styles.badgeNeutral}>
                <Text style={styles.badgeText}>Neutral (3.8)</Text>
              </View>
            </View>
            <Text style={styles.moduleSnippet}>"Pacing could be improved during the mid-term topics..."</Text>
          </View>
        </View>

        {/* Action Call */}
        <View style={styles.actionCard}>
          <Ionicons name="chatbubbles-outline" size={32} color="#8A2BE2" style={{marginBottom: 10}} />
          <Text style={styles.actionTitle}>Your voice matters</Text>
          <Text style={styles.actionDesc}>
            The insights here are generated from reviews submitted by students like you. Continue to provide honest feedback to improve the campus experience!
          </Text>
        </View>

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
    flex: 1,
  },
  themeToggle: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f06292',
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 12,
    color: '#ddd',
    textAlign: 'center',
    fontWeight: '600',
  },
  moduleMetric: {
    marginVertical: 5,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgePositive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  badgeNeutral: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  moduleSnippet: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 15,
  },
  actionCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  actionDesc: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  }
});
