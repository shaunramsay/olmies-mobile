import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function SurveyResultsScreen({ route, navigation }) {
  const { windowId, surveyName } = route.params;
  const { fetchWithAuth } = useAuth();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetchWithAuth(`/api/v1/mobile/surveys/windows/${windowId}/results`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          const errData = await response.json();
          setError(errData.error || 'Results are currently protected or unavailable.');
        }
      } catch (err) {
        console.error('Error fetching survey results:', err);
        setError('A network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [windowId, fetchWithAuth]);

  const renderDistributionBar = (dist, maxCount) => {
    // Fill percentage relative to the max count to scale the bars nicely
    const fillPercent = maxCount > 0 ? (dist.count / maxCount) * 100 : 0;
    
    // Choose color (Likert: 1-5, MultipleChoice: neutral)
    let barColor = '#60a5fa'; // Blue default
    if (dist.label === '5' || dist.label === '4' || dist.label.toLowerCase() === 'yes') barColor = '#10b981'; // Green
    if (dist.label === '3' || dist.label.toLowerCase() === 'maybe') barColor = '#f59e0b'; // Yellow
    if (dist.label === '2' || dist.label === '1' || dist.label.toLowerCase() === 'no') barColor = '#ef4444'; // Red

    return (
      <View key={dist.label} style={styles.barRow}>
        <Text style={styles.barLabel}>{dist.label}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${fillPercent}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={styles.barPercent}>{dist.percentage}%</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{color: '#888', marginTop: 15}}>Aggregating community responses...</Text>
      </View>
    );
  }

  if (error || !results) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="lock-closed-outline" size={48} color="#f06292" style={{marginBottom: 10}}/>
        <Text style={styles.errorText}>{error || 'This survey has not met the threshold to publish results.'}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter quantitative questions only
  const quantitativeQs = (results.questions || []).filter(q => q.type === 'Likert' || q.type === 'MultipleChoice');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{surveyName || 'Survey Results'}</Text>
          <Text style={styles.headerSubtitle}>Community Insights</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Executive Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="people" size={28} color="#60a5fa" />
            <Text style={styles.statValue}>{results.totalResponses}</Text>
            <Text style={styles.statLabel}>Total Responses</Text>
          </View>
          <View style={styles.statBox}>
             <Ionicons name="star" size={28} color="#fbbf24" />
             <Text style={styles.statValue}>
                {results.overallSatisfactionScore > 0 ? results.overallSatisfactionScore.toFixed(1) : 'N/A'}
             </Text>
             <Text style={styles.statLabel}>Avg Satisfaction</Text>
          </View>
        </View>

        {quantitativeQs.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={{color: '#aaa', marginTop: 40}}>No quantitative data available to display.</Text>
          </View>
        ) : (
          quantitativeQs.map((q, qIdx) => {
            const maxCount = Math.max(...(q.distribution || []).map(d => d.count), 0);
            return (
              <View key={q.questionId || qIdx} style={styles.questionCard}>
                <View style={styles.qHeader}>
                  <Text style={styles.qTitle}>{q.orderIndex}. {q.text}</Text>
                  {q.type === 'Likert' && q.meanScore && (
                    <View style={styles.meanBadge}>
                      <Text style={styles.meanBadgeText}>Avg: {q.meanScore}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.chartContainer}>
                  {(q.distribution || []).map(dist => renderDistributionBar(dist, maxCount))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  backButton: { marginRight: 15 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#4A90E2', marginTop: 2 },
  scrollContent: { padding: 15, paddingBottom: 60 },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#aaa', marginTop: 4 },

  questionCard: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  qTitle: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 22,
    marginRight: 15,
  },
  meanBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  meanBadgeText: { color: '#4A90E2', fontSize: 12, fontWeight: 'bold' },

  chartContainer: {
    marginTop: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 60,
    color: '#ccc',
    fontSize: 13,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPercent: {
    width: 45,
    textAlign: 'right',
    color: '#888',
    fontSize: 12,
  },
  
  errorText: { color: '#ddd', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  secondaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});
