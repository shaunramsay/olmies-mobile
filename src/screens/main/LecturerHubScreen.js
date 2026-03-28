import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Image, Platform, StatusBar, Linking, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUTechSemester } from '../../utils/dateUtils';
import { useAppTheme } from '../../context/ThemeContext';

export default function LecturerHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const [modules, setModules] = useState([]);
  const [deals, setDeals] = useState([]);
  const [openSurveys, setOpenSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [modulesRes, dealsRes, surveysRes] = await Promise.all([
          fetchWithAuth('/api/v1/mobile/modules'),
          fetchWithAuth('/api/v1/mobile/deals'),
          fetchWithAuth('/api/v1/mobile/open-surveys')
        ]);
        
        if (modulesRes.ok) {
          const modData = await modulesRes.json();
          setModules(modData);
        }
        if (dealsRes.ok) {
          const dealsData = await dealsRes.json();
          setDeals(dealsData);
        }
        if (surveysRes.ok) {
          const surveysData = await surveysRes.json();
          setOpenSurveys(surveysData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchWithAuth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0) }]}>
      
      {/* Sticky Header Section */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Ionicons name="school-outline" size={28} color={colors.primary} />
          <Text style={[styles.titleText, { color: colors.primary }]}>Lecturer Hub</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Welcome back, {user?.username || 'Lecturer'}.
        </Text>
        
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
        
        {/* Vendor Deals Carousel */}
        {deals.length > 0 && (
          <View style={styles.carouselContainer}>
            <View style={styles.carouselHeader}>
              <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
              <Text style={[styles.carouselTitle, { color: colors.text }]}>Campus Deals</Text>
            </View>
            <FlatList
              data={deals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingRight: 20 }}
              renderItem={({ item }) => {
                const handlePress = () => {
                  setSelectedDeal(item);
                };

                return (
                  <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                    <View style={[styles.dealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {item.bannerImageUrl && (
                        <Image source={{ uri: item.bannerImageUrl }} style={styles.dealImage} resizeMode="cover" />
                      )}
                      <View style={styles.dealTextContainer}>
                        <Text style={[styles.dealVendorName, { color: colors.text }]}>{item.vendorName}</Text>
                        <Text style={[styles.dealOfferText, { color: colors.textSecondary }]} numberOfLines={2}>{item.offerText}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Lecturer Info Card instead of Gamification */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="analytics-outline" size={20} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Module Evaluations</Text>
            </View>
          </View>
          
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            As an instructor, you can monitor the completion rates and feedback from your students in real-time on the Web Admin Panel. Full analytics will be continuously available.
          </Text>
        </View>

        {/* My Modules Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            My Teaching Modules - {getUTechSemester().fullDisplay}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          {loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : modules.length === 0 ? (
             <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>You are not currently assigned to any active modules.</Text>
          ) : (
            modules.map((mod, index) => (
              <View key={mod.moduleOfferingId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.moduleLabel, { color: colors.primary }]}>{mod.moduleCode}</Text>
                    <Text style={[styles.moduleCode, { color: colors.text }]}>{mod.moduleName || mod.moduleCode}</Text>
                  </View>
                  
                  {mod.activeSurveyId ? (
                    <View style={[styles.lockedButton, {backgroundColor: `${colors.primary}26`, borderColor: colors.primary}]}>
                      <Ionicons name="pulse-outline" size={16} color={colors.primary} style={{marginRight: 4}} />
                      <Text style={[styles.lockedButtonText, {color: colors.primary}]}>Survey Active</Text>
                    </View>
                  ) : (
                    <View style={[styles.lockedButton, {backgroundColor: colors.border}]}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{marginRight: 4}} />
                      <Text style={[styles.lockedButtonText, {color: colors.textSecondary}]}>No Survey</Text>
                    </View>
                  )}
                  
                </View>
                {index < modules.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))
          )}
        </View>

        {/* Open Campus Surveys Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="sparkles-outline" size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Open Campus Surveys</Text>
          </View>
          
          <View style={{marginTop: 15}}>
          {loading ? (
             <ActivityIndicator size="small" color={colors.secondary} />
          ) : openSurveys.length === 0 ? (
             <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>There are currently no open campus-wide surveys.</Text>
          ) : (
            openSurveys.map((survey, index) => (
              <View key={survey.surveyId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.moduleLabel, {color: colors.secondary}]}>{survey.audience} Survey</Text>
                    <Text style={[styles.moduleCode, { color: colors.text }]}>{survey.name}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.primaryButton, {backgroundColor: colors.secondary}]}
                    onPress={() => navigation.navigate('Survey', { surveyId: survey.surveyId, moduleCode: survey.name })}
                  >
                    <Ionicons name="sparkles" size={16} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.primaryButtonText}>Participate</Text>
                  </TouchableOpacity>
                  
                </View>
                {index < openSurveys.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))
          )}
          </View>
        </View>

      </ScrollView>

      {/* Full Deal Modal */}
      <Modal visible={!!selectedDeal} animationType="slide" transparent={true} onRequestClose={() => setSelectedDeal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selectedDeal?.bannerImageUrl ? (
              <Image source={{ uri: selectedDeal.bannerImageUrl }} style={styles.modalImage} resizeMode="cover" />
            ) : selectedDeal?.id?.toString().startsWith('ad-slot') ? (
               <View style={[styles.modalImage, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="megaphone-outline" size={60} color={colors.info || '#64b5f6'} />
               </View>
            ) : (
               <View style={[styles.modalImage, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="pricetag-outline" size={60} color={colors.primary || '#8A2BE2'} />
               </View>
            )}
            <View style={styles.modalTextContainer}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedDeal?.vendorName}</Text>
              <ScrollView style={styles.modalMessageBody}>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{selectedDeal?.offerText}</Text>
              </ScrollView>
              
              {selectedDeal?.websiteUrl && (
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: colors.primary, marginTop: 24 }]} 
                  onPress={() => {
                    Linking.openURL(selectedDeal.websiteUrl).catch(() => Alert.alert("Error", "Could not open link"));
                  }}
                >
                  <Text style={styles.closeButtonText}>Visit Website</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: colors.border, marginTop: selectedDeal?.websiteUrl ? 12 : 24 }]} 
                onPress={() => setSelectedDeal(null)}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  titleText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  subtitle: { fontSize: 13, paddingHorizontal: 0 },
  topRightActions: {
    position: 'absolute',
    top: 15,
    right: 20,
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
  carouselContainer: { marginBottom: 20 },
  carouselHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 5 },
  carouselTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  dealCard: { backgroundColor: '#1E1E1E', borderRadius: 12, marginRight: 15, width: 260, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  dealImage: { width: '100%', height: 120 },
  dealTextContainer: { padding: 12 },
  dealVendorName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  dealOfferText: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4, // Android shadow
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  cardDescription: { fontSize: 14, color: '#aaa', lineHeight: 22, marginBottom: 20 },
  lockedButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  lockedButtonText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#2A2A2A', marginVertical: 15 },
  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleLabel: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  moduleCode: { color: '#fff', fontSize: 16, fontWeight: '600' },
  primaryButton: { flexDirection: 'row', backgroundColor: '#5C6BC0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
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
    marginBottom: 12,
  },
  modalMessageBody: {
    maxHeight: 250,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
