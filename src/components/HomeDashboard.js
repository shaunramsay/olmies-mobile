import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Image, Platform, StatusBar, Linking, Alert, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { getUTechSemester } from '../utils/dateUtils';
import API_BASE_URL from '../config/api';

const formatNotificationDate = (value) => {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'Academic':
      return { name: 'alert-circle-outline', color: '#ffb74d' };
    case 'Promo':
      return { name: 'pricetag-outline', color: '#f06292' };
    case 'Survey':
      return { name: 'clipboard-outline', color: '#4A90E2' };
    default:
      return { name: 'information-circle-outline', color: '#64b5f6' };
  }
};

export default function HomeDashboard({ navigation, title, fallbackName, iconName, accentKey = 'primary' }) {
  const insets = useSafeAreaInsets();
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [deals, setDeals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const accentColor = colors[accentKey] || colors.primary;
  const semester = getUTechSemester().fullDisplay;
  const isCompactPreview = Platform.OS === 'web' && width < 760;
  const showHeaderActions = !(Platform.OS === 'web' && width < 760);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [dealsResult, notificationsResult] = await Promise.allSettled([
          fetchWithAuth('/api/v1/mobile/deals'),
          fetchWithAuth('/api/v1/campushub/notifications')
        ]);

        if (!isMounted) return;

        if (dealsResult.status === 'fulfilled' && dealsResult.value.ok) {
          setDeals(await dealsResult.value.json());
        }

        if (notificationsResult.status === 'fulfilled' && notificationsResult.value.ok) {
          const data = await notificationsResult.value.json();
          setNotifications(data.slice(0, 5).map(item => ({
            id: item.id,
            title: item.title,
            message: item.message,
            date: formatNotificationDate(item.createdAt),
            fullDate: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently',
            type: item.type,
            isRead: item.isRead,
            imageUrl: resolveImageUrl(item.imageUrl)
          })));
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, [fetchWithAuth]);

  const dealData = deals.length >= 3
    ? deals.slice(0, 3)
    : [
        ...deals,
        ...Array(3 - deals.length).fill({
          id: 'ad-slot',
          vendorName: 'Advertise With UTech, Jamaica',
          offerText: 'Reach students and staff across campus from the UTech home screen.',
          bannerImageUrl: null
        })
      ].map((item, index) => ({ ...item, id: item.id === 'ad-slot' ? `ad-slot-${index}` : item.id }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0) }]}>
      <View style={[styles.stickyHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Ionicons name={iconName} size={28} color={accentColor} />
          <Text style={[styles.titleText, { color: accentColor }]}>{title}</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Welcome back, {user?.username || fallbackName}.
        </Text>

        {showHeaderActions && (
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => navigation.navigate('DataProtection', { isReviewMode: true })}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={toggleTheme}>
              <Ionicons name={isDarkTheme ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.textSecondary} />
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
        )}
      </View>

      <View style={[styles.bannerDock, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.heroCard, isCompactPreview && styles.heroCardCompact]}>
          <View style={[styles.heroCopy, isCompactPreview && styles.heroCopyCompact]}>
            <Text style={styles.heroEyebrow}>University of Technology, Jamaica</Text>
            <Text style={[styles.heroTitle, isCompactPreview && styles.heroTitleCompact, { color: colors.text }]}>UTech Campus Companion</Text>
            <View style={styles.heroPills}>
              <View style={styles.semesterPill}>
                <Ionicons name="calendar-outline" size={13} color="#f6c943" />
                <Text style={styles.semesterPillText}>{semester}</Text>
              </View>
              <View style={[styles.statusPill, { borderColor: colors.border }]}>
                <Ionicons name="radio-outline" size={13} color={colors.success} />
                <Text style={[styles.statusPillText, { color: colors.textSecondary }]}>Live campus feed</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, isCompactPreview && styles.sectionHeaderCompact]}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Latest Notifications</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={styles.textButton}>
              <Text style={[styles.textButtonLabel, { color: colors.primary }]}>View all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : notifications.length === 0 ? (
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>No new notifications right now.</Text>
          ) : (
            notifications.map((item, index) => {
              const icon = getNotificationIcon(item.type);
              return (
                <TouchableOpacity key={item.id || index} style={styles.notificationRow} onPress={() => setSelectedNotification(item)}>
                  <View style={[styles.notificationIcon, { backgroundColor: `${icon.color}22` }]}>
                    <Ionicons name={icon.name} size={18} color={icon.color} />
                  </View>
                  <View style={styles.notificationCopy}>
                    <Text style={[styles.notificationTitle, { color: item.isRead ? colors.text : colors.primary }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                  </View>
                  <Text style={[styles.notificationDate, { color: colors.textSecondary }]}>{item.date}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={[styles.carouselTitle, { color: colors.text }]}>Campus Deals</Text>
          </View>
          <FlatList
            data={dealData}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingRight: 20 }}
            renderItem={({ item }) => {
              const isAdSlot = item.id.toString().startsWith('ad-slot');

              return (
                <TouchableOpacity onPress={() => setSelectedDeal(item)} activeOpacity={0.8}>
                  <View style={[styles.dealCard, { width: isCompactPreview ? 214 : 260, backgroundColor: colors.surface, borderColor: isAdSlot ? colors.info : colors.border }, isAdSlot && styles.adSlotCard]}>
                    {item.bannerImageUrl ? (
                      <Image source={{ uri: item.bannerImageUrl }} style={styles.dealImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.dealImage, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name={isAdSlot ? 'megaphone-outline' : 'pricetag-outline'} size={38} color={isAdSlot ? colors.info : colors.primary} />
                      </View>
                    )}
                    <View style={styles.dealTextContainer}>
                      <Text style={[styles.dealVendorName, { color: isAdSlot ? colors.info : colors.text }]}>{item.vendorName}</Text>
                      <Text style={[styles.dealOfferText, { color: colors.textSecondary }]} numberOfLines={2}>{item.offerText}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </ScrollView>

      <Modal visible={!!selectedDeal} animationType="slide" transparent={true} onRequestClose={() => setSelectedDeal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selectedDeal?.bannerImageUrl ? (
              <Image source={{ uri: selectedDeal.bannerImageUrl }} style={styles.modalImage} resizeMode="cover" />
            ) : (
              <View style={[styles.modalImage, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name={selectedDeal?.id?.toString().startsWith('ad-slot') ? 'megaphone-outline' : 'pricetag-outline'} size={60} color={selectedDeal?.id?.toString().startsWith('ad-slot') ? colors.info : colors.primary} />
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
                    Linking.openURL(selectedDeal.websiteUrl).catch(() => Alert.alert('Error', 'Could not open link'));
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

      <Modal visible={!!selectedNotification} animationType="slide" transparent={true} onRequestClose={() => setSelectedNotification(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selectedNotification?.imageUrl && (
              <Image source={{ uri: selectedNotification.imageUrl }} style={styles.modalImage} resizeMode="cover" />
            )}
            <View style={styles.modalTextContainer}>
              <View style={styles.notificationModalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, flex: 1 }]}>{selectedNotification?.title}</Text>
                {selectedNotification?.type && (
                  <View style={[styles.typeBadge, { borderColor: colors.border }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>{selectedNotification.type}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.modalDate, { color: colors.textSecondary }]}>{selectedNotification?.fullDate}</Text>
              <ScrollView style={styles.modalMessageBody}>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{selectedNotification?.message}</Text>
              </ScrollView>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.primary, marginTop: 24 }]}
                onPress={() => setSelectedNotification(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
  bannerDock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 5,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroCardCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroCopy: { flex: 1, paddingRight: 0 },
  heroCopyCompact: { paddingRight: 0, width: '100%' },
  heroEyebrow: {
    color: '#f6c943',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', lineHeight: 24, marginBottom: 9 },
  heroTitleCompact: { fontSize: 19, lineHeight: 23 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  semesterPill: {
    backgroundColor: '#111046',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  semesterPillText: { color: '#f6c943', fontSize: 11, fontWeight: '800' },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 8 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  cardDescription: { fontSize: 14, lineHeight: 22 },
  textButton: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  textButtonLabel: { fontSize: 13, fontWeight: '800' },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  notificationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationCopy: { flex: 1, paddingRight: 8 },
  notificationTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  notificationMessage: { fontSize: 12, lineHeight: 17 },
  notificationDate: { fontSize: 11, fontWeight: '700' },
  carouselContainer: { marginBottom: 20 },
  carouselHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 5 },
  carouselTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  dealCard: {
    borderRadius: 12,
    marginRight: 15,
    width: 260,
    borderWidth: 1,
    overflow: 'hidden',
  },
  adSlotCard: { borderStyle: 'dashed' },
  dealImage: { width: '100%', height: 120 },
  dealTextContainer: { padding: 12 },
  dealVendorName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  dealOfferText: { fontSize: 14, lineHeight: 20 },
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
  modalDate: {
    fontSize: 13,
    marginBottom: 18,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
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
  },
});
