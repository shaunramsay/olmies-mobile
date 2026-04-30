import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function HistoryScreen({ navigation }) {
  const { fetchWithAuth } = useAuth();
  
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const returnToSurveys = () => {
    const routeNames = navigation.getState?.().routeNames || [];
    if (routeNames.includes('Surveys')) {
      navigation.navigate('Surveys');
      return;
    }

    navigation.navigate('Main', { screen: 'Surveys' });
  };

  const loadPastSurveys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/v1/mobile/past-surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
      } else {
        setError('Failed to load past surveys.');
      }
    } catch (err) {
      console.error('Error fetching past surveys:', err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPastSurveys();
  }, [fetchWithAuth]);

  const renderSurveyItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('SurveyResults', { windowId: item.windowId, surveyName: item.name })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="pie-chart" size={24} color="#4A90E2" />
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.semester} {item.year}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={returnToSurveys}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Community Results</Text>
          <Text style={styles.headerSubtitle}>View analytics from past Open Campus Surveys</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#f06292" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPastSurveys}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : surveys.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="document-text-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No past surveys available yet.</Text>
        </View>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={(item) => item.windowId.toString()}
          renderItem={renderSurveyItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  backButton: { marginRight: 15, padding: 4 },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#aaa' },
  listContent: { padding: 15 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  cardSubtitle: { fontSize: 13, color: '#aaa', marginTop: 4 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ccc', marginTop: 15, textAlign: 'center' },
  emptyText: { color: '#888', fontSize: 16, marginTop: 15 },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: 'bold' }
});
