import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUTechSemester } from '../../utils/dateUtils';

export default function LecturerHubScreen({ navigation }) {
  const { user, fetchWithAuth, logout } = useAuth();
  const [modules, setModules] = useState([]);
  const [deals, setDeals] = useState([]);
  const [openSurveys, setOpenSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#888" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Ionicons name="school-outline" size={32} color="#8A2BE2" />
            <Text style={[styles.titleText, { color: '#8A2BE2' }]}>Lecturer Hub</Text>
          </View>
          <Text style={styles.subtitle}>
            Welcome back, Professor {user?.username || 'Lecturer'}. Manage your assigned modules and review active evaluations.
          </Text>
        </View>

        {/* Vendor Deals Carousel */}
        {deals.length > 0 && (
          <View style={styles.carouselContainer}>
            <View style={styles.carouselHeader}>
              <Ionicons name="pricetag-outline" size={20} color="#8A2BE2" />
              <Text style={styles.carouselTitle}>Campus Deals</Text>
            </View>
            <FlatList
              data={deals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingRight: 20 }}
              renderItem={({ item }) => (
                <View style={styles.dealCard}>
                  {item.bannerImageUrl && (
                    <Image source={{ uri: item.bannerImageUrl }} style={styles.dealImage} resizeMode="cover" />
                  )}
                  <View style={styles.dealTextContainer}>
                    <Text style={styles.dealVendorName}>{item.vendorName}</Text>
                    <Text style={styles.dealOfferText} numberOfLines={2}>{item.offerText}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Lecturer Info Card instead of Gamification */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="analytics-outline" size={20} color="#fff" />
              <Text style={styles.cardTitle}>Module Evaluations</Text>
            </View>
          </View>
          
          <Text style={styles.cardDescription}>
            As an instructor, you can monitor the completion rates and feedback from your students in real-time on the Web Admin Panel. Full analytics will be continuously available.
          </Text>
        </View>

        {/* My Modules Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            My Teaching Modules - {getUTechSemester().fullDisplay}
          </Text>
          <View style={styles.divider} />
          
          {loading ? (
             <ActivityIndicator size="large" color="#8A2BE2" style={{ marginVertical: 20 }} />
          ) : modules.length === 0 ? (
             <Text style={styles.cardDescription}>You are not currently assigned to any active modules.</Text>
          ) : (
            modules.map((mod, index) => (
              <View key={mod.moduleOfferingId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={styles.moduleLabel}>{mod.moduleCode}</Text>
                    <Text style={styles.moduleCode}>{mod.moduleName || mod.moduleCode}</Text>
                  </View>
                  
                  {mod.activeSurveyId ? (
                    <View style={[styles.lockedButton, {backgroundColor: 'rgba(138, 43, 226, 0.15)', borderColor: '#8A2BE2'}]}>
                      <Ionicons name="pulse-outline" size={16} color="#8A2BE2" style={{marginRight: 4}} />
                      <Text style={[styles.lockedButtonText, {color: '#8A2BE2'}]}>Survey Active</Text>
                    </View>
                  ) : (
                    <View style={[styles.lockedButton, {backgroundColor: '#222'}]}>
                      <Ionicons name="time-outline" size={14} color="#888" style={{marginRight: 4}} />
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
          
          <View style={{marginTop: 15}}>
          {loading ? (
             <ActivityIndicator size="small" color="#f06292" />
          ) : openSurveys.length === 0 ? (
             <Text style={styles.cardDescription}>There are currently no open campus-wide surveys.</Text>
          ) : (
            openSurveys.map((survey, index) => (
              <View key={survey.surveyId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.moduleLabel, {color: '#f06292'}]}>{survey.audience} Survey</Text>
                    <Text style={styles.moduleCode}>{survey.name}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.primaryButton, {backgroundColor: '#f06292'}]}
                    onPress={() => navigation.navigate('Survey', { surveyId: survey.surveyId, moduleCode: survey.name })}
                  >
                    <Ionicons name="sparkles" size={16} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.primaryButtonText}>Participate</Text>
                  </TouchableOpacity>
                  
                </View>
                {index < openSurveys.length - 1 && <View style={styles.divider} />}
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
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginVertical: 30, position: 'relative' },
  logoutButton: { position: 'absolute', top: -15, right: 0, flexDirection: 'row', alignItems: 'center', padding: 8 },
  logoutText: { color: '#888', marginLeft: 4, fontSize: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  titleText: { fontSize: 28, fontWeight: 'bold', marginLeft: 10 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  carouselContainer: { marginBottom: 20 },
  carouselHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 5 },
  carouselTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  dealCard: { backgroundColor: '#1E1E1E', borderRadius: 12, marginRight: 15, width: 260, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  dealImage: { width: '100%', height: 120 },
  dealTextContainer: { padding: 12 },
  dealVendorName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  dealOfferText: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: '#161616', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
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
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});
