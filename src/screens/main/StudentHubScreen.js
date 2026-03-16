import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function StudentHubScreen({ navigation }) {
  const { user, fetchWithAuth, logout } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetchWithAuth('/api/v1/mobile/modules');
        if (response.ok) {
          const data = await response.json();
          setModules(data);
        }
      } catch (err) {
        console.error('Error fetching modules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [fetchWithAuth]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#888" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Ionicons name="ribbon-outline" size={32} color="#f06292" />
            <Text style={styles.titleText}>Student Hub</Text>
          </View>
          <Text style={styles.subtitle}>
            Welcome back, {user?.username || 'Student'}. Manage your academic progress and evaluations.
          </Text>
        </View>

        {/* Early Grade Access Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
              <Text style={styles.cardTitle}>Early Grade Access</Text>
            </View>
            <TouchableOpacity style={styles.lockedButton} disabled>
              <Ionicons name="lock-closed-outline" size={14} color="#aaa" style={{marginRight: 4}} />
              <Text style={styles.lockedButtonText}>Locked</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.cardDescription}>
            You need to evaluate 100% of your modules to unlock early grade access. Evaluate 100% of your active modules to unlock your grades before the official release date!
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${modules.length > 0 ? (Math.round((modules.filter(m => m.hasCompleted).length / modules.length) * 100)) : 0}%` }]} />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLeft}>{modules.filter(m => m.hasCompleted).length} Evaluated</Text>
              <Text style={styles.progressTextRight}>{modules.length} Total</Text>
            </View>
          </View>
        </View>

        {/* My Modules Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {modules.length > 0 
              ? `My Modules - ${modules[0].semester} - ${modules[0].year}` 
              : 'My Modules'}
          </Text>
          <View style={styles.divider} />
          
          {loading ? (
             <ActivityIndicator size="large" color="#8A2BE2" style={{ marginVertical: 20 }} />
          ) : modules.length === 0 ? (
             <Text style={styles.cardDescription}>You are not currently enrolled in any active modules.</Text>
          ) : (
            modules.map((mod, index) => (
              <View key={mod.moduleOfferingId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={styles.moduleLabel}>{mod.moduleCode}</Text>
                    <Text style={styles.moduleCode}>{mod.moduleName || mod.moduleCode}</Text>
                  </View>
                  
                  {mod.hasCompleted ? (
                    <View style={[styles.lockedButton, {backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: '#4caf50'}]}>
                      <Ionicons name="checkmark-done" size={16} color="#4caf50" style={{marginRight: 4}} />
                      <Text style={[styles.lockedButtonText, {color: '#4caf50'}]}>Completed</Text>
                    </View>
                  ) : mod.activeSurveyId ? (
                    <TouchableOpacity 
                      style={styles.primaryButton}
                      onPress={() => navigation.navigate('Survey', { surveyId: mod.activeSurveyId, moduleCode: mod.moduleCode })}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{marginRight: 6}} />
                      <Text style={styles.primaryButtonText}>Take Survey</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.lockedButton, {backgroundColor: '#222'}]}>
                      <Ionicons name="lock-closed-outline" size={14} color="#888" style={{marginRight: 4}} />
                      <Text style={[styles.lockedButtonText, {color: '#888'}]}>No Survey</Text>
                    </View>
                  )}
                  
                </View>
                {index < modules.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        {/* Open Campus Surveys Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="sparkles-outline" size={20} color="#f06292" />
            <Text style={styles.cardTitle}>Open Campus Surveys</Text>
          </View>
          <Text style={styles.cardDescription}>
            There are currently no open campus-wide surveys.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Darkest background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: -15,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  logoutText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f06292', // Pinkish theme from screenshot
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
    marginBottom: 20,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  lockedButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8A2BE2', // Changed from plain to OLMIES purple to pop more than plain grey
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressTextLeft: {
    color: '#888',
    fontSize: 12,
  },
  progressTextRight: {
    color: '#888',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 15,
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleLabel: {
    color: '#8A2BE2',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moduleCode: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#5C6BC0', // Indigo color from web screenshot
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  }
});
