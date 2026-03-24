import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUTechSemester } from '../../utils/dateUtils';
import { useAppTheme } from '../../context/ThemeContext';

export default function StudentHubScreen({ navigation }) {
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors } = useAppTheme();
  const [modules, setModules] = useState([]);
  const [deals, setDeals] = useState([]);
  const [openSurveys, setOpenSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const requests = [
          fetchWithAuth('/api/v1/mobile/deals'),
          fetchWithAuth('/api/v1/mobile/open-surveys')
        ];
        
        if (user) {
          requests.unshift(fetchWithAuth('/api/v1/mobile/modules'));
        }

        const responses = await Promise.all(requests);
        
        if (user) {
          const [modulesRes, dealsRes, surveysRes] = responses;
          if (modulesRes.ok) setModules(await modulesRes.json());
          if (dealsRes.ok) setDeals(await dealsRes.json());
          if (surveysRes.ok) setOpenSurveys(await surveysRes.json());
        } else {
          const [dealsRes, surveysRes] = responses;
          if (dealsRes.ok) setDeals(await dealsRes.json());
          if (surveysRes.ok) setOpenSurveys(await surveysRes.json());
          setModules([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchWithAuth, user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Sticky Header Section */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Ionicons name="ribbon-outline" size={28} color={colors.secondary} />
          <Text style={[styles.titleText, { color: colors.secondary }]}>Student Hub</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Welcome back, {user?.username || 'Student'}.
        </Text>
        
        {user && (
          <TouchableOpacity style={[styles.logoutButtonTopRight, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Vendor Deals Carousel */}
        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={[styles.carouselTitle, { color: colors.text }]}>Campus Deals</Text>
          </View>
          <FlatList
            data={
              deals.length >= 3 
                ? deals.slice(0, 3) 
                : [
                    ...deals, 
                    ...Array(3 - deals.length).fill({ 
                      id: 'ad-slot', 
                      vendorName: 'Advertise With UTech, Jamaica', 
                      offerText: 'Reach thousands of students daily. Tap to learn more.', 
                      bannerImageUrl: null 
                    })
                  ].map((item, index) => ({ ...item, id: item.id === 'ad-slot' ? `ad-slot-${index}` : item.id }))
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingRight: 20 }}
            renderItem={({ item }) => {
              const isAdSlot = item.id.toString().startsWith('ad-slot');
              return (
                <View style={[styles.dealCard, { backgroundColor: colors.surface, borderColor: colors.border }, isAdSlot ? { backgroundColor: `${colors.info}1A`, borderColor: colors.info, borderWidth: 1, borderStyle: 'dashed' } : {}]}>
                  {item.bannerImageUrl ? (
                    <Image source={{ uri: item.bannerImageUrl }} style={styles.dealImage} resizeMode="cover" />
                  ) : isAdSlot ? (
                    <View style={[styles.dealImage, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                       <Ionicons name="megaphone-outline" size={40} color={colors.info} />
                    </View>
                  ) : null}
                  <View style={styles.dealTextContainer}>
                    <Text style={[styles.dealVendorName, { color: colors.text }, isAdSlot ? { color: colors.info } : {}]}>{item.vendorName}</Text>
                    <Text style={[styles.dealOfferText, { color: colors.textSecondary }]} numberOfLines={2}>{item.offerText}</Text>
                  </View>
                </View>
              );
            }}
          />
        </View>

        {/* Early Grade Access Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Early Grade Access</Text>
            </View>
            <TouchableOpacity style={styles.lockedButton} disabled>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} style={{marginRight: 4}} />
              <Text style={[styles.lockedButtonText, { color: colors.textSecondary }]}>Locked</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            {!user 
              ? "Sign in to view your progress toward early grade access!" 
              : "You need to evaluate 100% of your modules to unlock early grade access. Evaluate 100% of your active modules to unlock your grades before the official release date!"}
          </Text>

          {/* Progress Bar */}
          {user && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${modules.length > 0 ? (Math.round((modules.filter(m => m.hasCompleted).length / modules.length) * 100)) : 0}%` }]} />
              </View>
              <View style={styles.progressTextRow}>
                <Text style={[styles.progressTextLeft, { color: colors.textSecondary }]}>{modules.filter(m => m.hasCompleted).length} Evaluated</Text>
                <Text style={[styles.progressTextRight, { color: colors.textSecondary }]}>{modules.length} Total</Text>
              </View>
            </View>
          )}
        </View>

        {/* My Modules Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            My Modules - {getUTechSemester().fullDisplay}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          {!user ? (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginVertical: 10 }}>
              <Ionicons name="lock-closed-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={[styles.cardDescription, { textAlign: 'center', color: colors.textSecondary }]}>Sign in to view your enrolled modules and pending evaluations.</Text>
              <View style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 10 }]}>
                <Ionicons name="log-in-outline" size={18} color="#fff" style={{marginRight: 6}} />
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </View>
            </TouchableOpacity>
          ) : loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : modules.length === 0 ? (
             <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>You are not currently enrolled in any active modules.</Text>
          ) : (
            modules.map((mod, index) => (
              <View key={mod.moduleOfferingId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.moduleLabel, { color: colors.primary }]}>{mod.moduleCode}</Text>
                    <Text style={[styles.moduleCode, { color: colors.text }]}>{mod.moduleName || mod.moduleCode}</Text>
                  </View>
                  
                  {mod.hasCompleted ? (
                    <View style={[styles.lockedButton, {backgroundColor: `${colors.success}26`, borderColor: colors.success}]}>
                      <Ionicons name="checkmark-done" size={16} color={colors.success} style={{marginRight: 4}} />
                      <Text style={[styles.lockedButtonText, {color: colors.success}]}>Completed</Text>
                    </View>
                  ) : mod.activeSurveyId ? (
                    <TouchableOpacity 
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={() => navigation.navigate('Survey', { surveyId: mod.activeSurveyId, moduleCode: mod.moduleCode })}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{marginRight: 6}} />
                      <Text style={styles.primaryButtonText}>Take Survey</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.lockedButton, {backgroundColor: colors.border}]}>
                      <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} style={{marginRight: 4}} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButtonTopRight: {
    position: 'absolute',
    top: 15,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutTextTopRight: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 13,
  },
  carouselContainer: {
    marginBottom: 20,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  dealCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginRight: 15,
    width: 260,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  dealImage: {
    width: '100%',
    height: 120,
  },
  dealTextContainer: {
    padding: 12,
  },
  dealVendorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dealOfferText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4, // Android shadow
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
