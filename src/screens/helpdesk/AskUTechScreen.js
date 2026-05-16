import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import API_BASE_URL from '../../config/api';
import {
  formatHelpDeskResponseOnly,
  formatHelpDeskShareMessage,
  getAppDownloadUrl,
  isShareableHelpDeskAnswer,
} from '../../utils/helpDeskSharing';

let Audio = null;
try {
  if (Constants.appOwnership !== 'expo') {
    Audio = require('expo-av').Audio;
  }
} catch (e) {
  console.warn('expo-av native module not loaded.');
}

const APP_DOWNLOAD_URL = getAppDownloadUrl(process.env.EXPO_PUBLIC_APP_DOWNLOAD_URL);

export default function AskUTechScreen({ navigation, route }) {
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const { user, fetchWithAuth, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isPrimaryTab = route?.name === 'Help Desk';
  const getWelcomeText = (currentUser) => currentUser
    ? `Hello ${currentUser.username}! I am the UTech AI Help Desk. I can answer questions regarding academic policies based on your cohort.`
    : "Hello! I am the UTech AI Help Desk. Since you are not logged in, I will provide general answers based on the current handbook.";
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome_msg',
      text: getWelcomeText(user),
      sender: 'ai',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const flatListRef = useRef();
  const audioAvailable = !!Audio;

  useEffect(() => {
    setMessages((prev) => prev.map((message) => (
      message.id === 'welcome_msg'
        ? { ...message, text: getWelcomeText(user) }
        : message
    )));
  }, [user?.username]);

  const buildHelpdeskErrorMessage = async (response) => {
    const fallback = "I'm sorry, I couldn't connect to my knowledge base right now. Please try again later.";

    try {
      const rawText = await response.text();
      if (!rawText) {
        return fallback;
      }

      try {
        const data = JSON.parse(rawText);
        if (typeof data === 'string' && data.trim()) {
          return data.trim();
        }
        if (data?.message) {
          return data.message;
        }
        if (data?.error) {
          return data.error;
        }
        if (data?.title) {
          return data.title;
        }
      } catch {
        // Fall through and use the raw text if it is not JSON.
      }

      return rawText.trim() || fallback;
    } catch {
      return fallback;
    }
  };

  const startRecording = async () => {
    if (!audioAvailable) {
      Alert.alert("Feature Unavailable", "Voice recording requires a custom native app build. Not available in standard Expo Go.");
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert("Permission Needed", "Please enable microphone permissions to use voice search.");
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setRecording(null);
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        name: 'voice.m4a',
        type: 'audio/m4a',
      });

      const res = await fetchWithAuth('/api/v1/helpdesk/audio/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setInputText((prev) => prev ? prev + ' ' + data.text : data.text); 
        }
      } else {
        Alert.alert("Server Reject", "Audio could not be transcribed reliably.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not reach Transcription Server.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const normalizedInput = userMessage.text
        .toLowerCase()
        .replace(/[?!.,]/g, ' ')
        .trim();
      const historyTokens = normalizedInput.split(/\s+/).filter(Boolean);
      const dependsOnHistory = normalizedInput.length < 90 && (
        ['that', 'this', 'those', 'these', 'it', 'they', 'same', 'previous', 'above', 'more', 'also'].some(token => historyTokens.includes(token)) ||
        normalizedInput.startsWith('what about') ||
        normalizedInput.startsWith('how about') ||
        normalizedInput.startsWith('and ') ||
        normalizedInput.startsWith('but ')
      );
      const historyPayload = dependsOnHistory
        ? messages
            .filter(m => m.id !== 'welcome_msg')
            .slice(-3)
            .map(m => ({
              role: m.sender === 'ai' ? 'assistant' : 'user',
              content: m.text.length > 1200 ? `${m.text.slice(0, 1200).trim()}...` : m.text
            }))
        : [];

      const response = await fetchWithAuth('/api/v1/helpdesk/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.text,
          studentId: user?.username || user?.id || null,
          history: historyPayload
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: data.answer || "I couldn't find a complete answer just now. Please try again shortly.",
          sources: data.sources || [],
          isCohortSpecific: data.isCohortSpecific,
          questionText: userMessage.text,
          isError: !data.answer,
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const serverMessage = await buildHelpdeskErrorMessage(response);
        const aiError = {
          id: (Date.now() + 1).toString(),
          text: serverMessage,
          isError: true,
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiError]);
      }
    } catch (error) {
      console.error(error);
      const aiError = {
        id: (Date.now() + 1).toString(),
        text: __DEV__
          ? `I'm having trouble reaching the API at ${API_BASE_URL}. Please make sure the local backend is running and reachable from this device.`
          : "I'm having trouble connecting to the network. Please check your connection.",
        isError: true,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiError]);
    } finally {
      setIsTyping(false);
    }
  };

  const closeShareMenu = () => setShareTarget(null);

  const handleShareAnswer = async () => {
    if (!isShareableHelpDeskAnswer(shareTarget)) return;
    const shareText = formatHelpDeskShareMessage(shareTarget, { appDownloadUrl: APP_DOWNLOAD_URL });
    closeShareMenu();

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Failed to share Help Desk answer:', error);
      Alert.alert('Share unavailable', 'The native share sheet could not be opened right now.');
    }
  };

  const copyToClipboard = async (value, successMessage) => {
    closeShareMenu();

    try {
      await Clipboard.setStringAsync(value);
      Alert.alert('Copied', successMessage);
    } catch (error) {
      console.error('Failed to copy Help Desk answer:', error);
      Alert.alert('Copy unavailable', 'The answer could not be copied right now.');
    }
  };

  const handleCopyQuestionAndAnswer = () => {
    if (!isShareableHelpDeskAnswer(shareTarget)) return;
    const shareText = formatHelpDeskShareMessage(shareTarget, { appDownloadUrl: APP_DOWNLOAD_URL });
    copyToClipboard(shareText, 'Question and answer copied.');
  };

  const handleCopyResponseOnly = () => {
    if (!isShareableHelpDeskAnswer(shareTarget)) return;
    copyToClipboard(formatHelpDeskResponseOnly(shareTarget), 'Response copied.');
  };

  const renderShareAction = (label, iconName, onPress, isCancel = false) => (
    <TouchableOpacity
      style={[styles.shareAction, { borderBottomColor: colors.border }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={20} color={isCancel ? colors.textSecondary : colors.primary} />
      <Text style={[styles.shareActionText, { color: isCancel ? colors.textSecondary : colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    const canShare = isShareableHelpDeskAnswer(item);
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
        )}
        <TouchableOpacity
          activeOpacity={canShare ? 0.82 : 1}
          delayLongPress={350}
          onLongPress={canShare ? () => setShareTarget(item) : undefined}
          style={[
            styles.messageBubble,
            isUser
              ? [styles.messageBubbleUser, { backgroundColor: colors.primary }]
              : [styles.messageBubbleAi, { backgroundColor: colors.surface, borderColor: colors.border }]
          ]}
        >
          <Text style={[styles.messageText, isUser ? { color: '#fff' } : { color: colors.text }]}>{item.text}</Text>
          
          {!isUser && item.sources && item.sources.length > 0 && (
            <View style={[styles.sourcesContainer, { borderTopColor: colors.border }]}>
               <Text style={[styles.sourcesTitle, { color: colors.textSecondary }]}>Sources ({item.isCohortSpecific ? "Cohort Policy" : "General"}):</Text>
               {item.sources.map((src, i) => (
                  <Text key={i} style={[styles.sourceText, { color: colors.primary }]}>• {src}</Text>
               ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {isPrimaryTab ? (
            <View style={styles.headerSide} />
          ) : (
            <View style={styles.headerSide}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Ask UTech AI</Text>
            <Text style={[styles.headerSubtitle, { color: colors.success }]}>Online</Text>
          </View>
          <View style={styles.headerActions}>
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

        {/* Chat Area */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.chatContent, { paddingBottom: 20 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.textSecondary }]}>UTech AI is typing...</Text>
          </View>
        )}

        {/* Input Area */}
        {isRecording && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'red', marginRight: 8 }} />
            <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 12 }}>Recording Audio...</Text>
          </View>
        )}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 15) }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Ask about academic policies..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? "#fff" : colors.textSecondary} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity 
              style={[styles.micButton, { backgroundColor: isRecording ? '#ef4444' : colors.surface, borderColor: isRecording ? '#dc2626' : colors.border, borderWidth: 1, opacity: audioAvailable ? 1 : 0.35 }]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isTranscribing || !audioAvailable}
            >
              {isTranscribing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                  <Ionicons name={isRecording ? "mic" : "mic-outline"} size={22} color={isRecording ? "#fff" : audioAvailable ? colors.textSecondary : '#666'} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={!!shareTarget}
        transparent
        animationType="slide"
        onRequestClose={closeShareMenu}
      >
        <View style={styles.shareModalRoot}>
          <TouchableOpacity style={styles.shareBackdrop} activeOpacity={1} onPress={closeShareMenu} />
          <View style={[
            styles.shareSheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16)
            }
          ]}>
            <View style={styles.shareHandle} />
            <Text style={[styles.shareTitle, { color: colors.text }]}>Answer actions</Text>
            <Text style={[styles.sharePrivacyNote, { color: colors.textSecondary }]}>
              Only share information you're comfortable sending outside the app.
            </Text>
            {renderShareAction('Share Answer', 'share-social-outline', handleShareAnswer)}
            {renderShareAction('Copy Question & Answer', 'copy-outline', handleCopyQuestionAndAnswer)}
            {renderShareAction('Copy Response Only', 'document-text-outline', handleCopyResponseOnly)}
            {renderShareAction('Cancel', 'close-outline', closeShareMenu, true)}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerSide: {
    width: 88,
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerActions: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chatContent: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  messageBubbleUser: {
    borderBottomRightRadius: 4,
  },
  messageBubbleAi: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    marginBottom: 2,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    marginRight: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  shareModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  shareSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  shareHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.7)',
    marginBottom: 14,
  },
  shareTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  sharePrivacyNote: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  shareAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  shareActionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '700',
  }
});
