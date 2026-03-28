import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function SurveyScreen({ route, navigation }) {
  const { surveyId, moduleCode } = route.params;
  const { fetchWithAuth, getDeviceId } = useAuth();
  
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetchWithAuth(`/api/v1/execution/surveys/${surveyId}`);
        if (response.ok) {
          const data = await response.json();
          setSurvey(data);
        } else {
          setError('Failed to load the survey. It may be inactive or locked.');
        }
      } catch (err) {
        console.error('Error fetching survey details:', err);
        setError('A network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId, fetchWithAuth]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const payload = {
        surveyId: surveyId,
        answers: answers,
        deviceId: deviceId
      };

      const response = await fetchWithAuth('/api/v1/execution/responses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowSuccessModal(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
        ]).start();

        setTimeout(() => {
          Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
            setShowSuccessModal(false);
            navigation.goBack();
          });
        }, 2200);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to submit the survey.');
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
      alert('An unexpected error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question) => {
    // Determine the type from Question
    // In our backend it might be "Likert", "FreeText", "MultipleChoice"
    const type = question.type || question.Type || ''; 
    const currentAnswer = answers[question.id] || '';

    switch (type.toLowerCase()) {
      case 'likert':
        // For Likert scale, typically 1 to 5
        return (
          <View style={styles.likertContainer}>
            {[1, 2, 3, 4, 5].map(score => (
              <TouchableOpacity
                key={score}
                style={[
                  styles.likertOption, 
                  currentAnswer === score.toString() && styles.likertOptionSelected
                ]}
                onPress={() => handleAnswerChange(question.id, score.toString())}
              >
                <Text style={[
                  styles.likertText,
                  currentAnswer === score.toString() && styles.likertTextSelected
                ]}>{score}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 'multiplechoice':
        return (
          <View style={styles.choicesContainer}>
            {(question.choices || []).map(choice => (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.choiceButton,
                  currentAnswer === choice && styles.choiceButtonSelected
                ]}
                onPress={() => handleAnswerChange(question.id, choice)}
              >
                <Text style={[
                  styles.choiceText,
                  currentAnswer === choice && styles.choiceTextSelected
                ]}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'freetext':
      default:
        return (
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Type your answer here..."
            placeholderTextColor="#666"
            value={currentAnswer}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
          />
        );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f06292" />
        <Text style={{color: '#888', marginTop: 15}}>Loading your survey...</Text>
      </View>
    );
  }

  if (error || !survey) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="warning-outline" size={48} color="#f06292" style={{marginBottom: 10}}/>
        <Text style={styles.errorText}>{error || 'Survey content is unavailable.'}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{survey.title || moduleCode + ' Evaluation'}</Text>
          <Text style={styles.headerSubtitle}>{moduleCode} - {survey.sections?.length || 0} Sections</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {(survey.sections || []).map((section, idx) => (
          <View key={section.id || idx} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.instructions && (
                <Text style={styles.sectionInstructions}>{section.instructions}</Text>
              )}
            </View>

            {(section.questions || []).map((question, qIdx) => (
              <View key={question.id || qIdx} style={styles.questionContainer}>
                <Text style={styles.questionText}>
                  {qIdx + 1}. {question.text}
                </Text>
                {renderQuestionInput(question)}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" style={{marginRight: 8}}/>
            ) : (
              <Ionicons name="paper-plane-outline" size={20} color="#fff" style={{marginRight: 8}} />
            )}
            <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Evaluation'}</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSuccessModal} transparent animationType="none">
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.successCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.checkmarkCircle}>
                <Ionicons name="checkmark-sharp" size={55} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Thank You!</Text>
              <Text style={styles.successMessage}>Your response has been successfully recorded.</Text>
            </Animated.View>
          </View>
        </Modal>

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
  headerSubtitle: { fontSize: 12, color: '#f06292', marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionContainer: { marginBottom: 30 },
  sectionHeader: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8A2BE2',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  sectionInstructions: { fontSize: 13, color: '#aaa', marginTop: 5, fontStyle: 'italic' },
  questionContainer: {
    backgroundColor: '#161616',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  questionText: { fontSize: 15, color: '#fff', marginBottom: 15, lineHeight: 22, fontWeight: '600' },
  
  // Free text
  textInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    color: '#ddd',
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },

  // Likert
  likertContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  likertOption: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likertOptionSelected: { backgroundColor: 'rgba(240, 98, 146, 0.2)', borderColor: '#f06292' },
  likertText: { color: '#888', fontWeight: 'bold' },
  likertTextSelected: { color: '#f06292' },

  // Multiple Choice
  choicesContainer: { gap: 10 },
  choiceButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 14,
    borderRadius: 8,
  },
  choiceButtonSelected: { backgroundColor: 'rgba(138, 43, 226, 0.15)', borderColor: '#8A2BE2' },
  choiceText: { color: '#bbb', fontSize: 14 },
  choiceTextSelected: { color: '#fff', fontWeight: 'bold' },

  footer: { marginTop: 20, alignItems: 'center' },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#f06292',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  errorText: { color: '#ddd', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  secondaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: '#1E1E1E', borderRadius: 24, padding: 35, width: '85%', alignItems: 'center', shadowColor: '#f06292', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 15 },
  checkmarkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f06292', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  successMessage: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 24 }
});
