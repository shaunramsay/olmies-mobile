import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Image, Platform, StatusBar, Linking, Alert, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { fetchUTechSemester, getUTechSemester } from '../utils/dateUtils';
import FullscreenImageViewer from './FullscreenImageViewer';
import NotificationDetailModal from './NotificationDetailModal';
import API_BASE_URL from '../config/api';
import { brand, fonts, radii, shadow, spacing } from '../utils/theme';
const { isVisibleNotification } = require('../utils/notificationVisibility');

const formatNotificationDate = (value) => {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  const ageMs = Date.now() - parsed.getTime();
  if (ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000) {
    return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl || trimmedUrl === 'null') return null;
  if (trimmedUrl.startsWith('http')) return trimmedUrl;
  return `${API_BASE_URL}${trimmedUrl}`;
};

const hasValidImageUrl = (imageUrl) => (
  typeof imageUrl === 'string' &&
  imageUrl.trim().length > 5 &&
  imageUrl.trim() !== 'null'
);

const getNotificationIcon = (type, colors) => {
  switch (type) {
    case 'Academic':
      return { name: 'alert-circle-outline', color: colors.warning };
    case 'Promo':
      return { name: 'pricetag-outline', color: colors.accentInk };
    case 'Survey':
      return { name: 'clipboard-outline', color: colors.secondary };
    default:
      return { name: 'information-circle-outline', color: colors.info };
  }
};

export default function HomeDashboard({ navigation, fallbackName }) {
  const insets = useSafeAreaInsets();
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [deals, setDeals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
  const [semester, setSemester] = useState(() => getUTechSemester().fullDisplay);

  const isCompactPreview = Platform.OS === 'web' && width < 760;
  const notificationCardWidth = Math.min(Math.max(width - 98, 230), isCompactPreview ? 310 : 320);
  const notificationSnapInterval = notificationCardWidth + 12;

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [dealsResult, notificationsResult, semesterResult] = await Promise.allSettled([
          fetchWithAuth('/api/v1/mobile/deals'),
          fetchWithAuth('/api/v1/campushub/notifications'),
          fetchUTechSemester(fetchWithAuth)
        ]);

        if (!isMounted) return;

        if (semesterResult.status === 'fulfilled') {
          setSemester(semesterResult.value.fullDisplay);
        }

        if (dealsResult.status === 'fulfilled' && dealsResult.value.ok) {
          setDeals(await dealsResult.value.json());
        }

        if (notificationsResult.status === 'fulfilled' && notificationsResult.value.ok) {
          const data = await notificationsResult.value.json();
          setNotifications(data
            .filter(isVisibleNotification)
            .slice(0, 5)
            .map(item => ({
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

  useEffect(() => {
    setActiveNotificationIndex(0);
  }, [notifications.length]);

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
      <View style={[styles.utilityHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => navigation.navigate('DataProtection', { isReviewMode: true })}
          >
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? 'sunny-outline' : 'moon-outline'} size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          {user ? (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.bannerDock, { backgroundColor: colors.background }]}>
        <View style={[styles.heroCard, isCompactPreview && styles.heroCardCompact]}>
          <View style={styles.heroRing} />
          <View style={[styles.heroCopy, isCompactPreview && styles.heroCopyCompact]}>
            <Text style={styles.heroEyebrow}>University of Technology, Jamaica</Text>
            <Text style={[styles.heroTitle, isCompactPreview && styles.heroTitleCompact]}>UTech Campus Companion</Text>
            <Text style={styles.heroGreeting}>
              Welcome back, {user?.username || fallbackName}.
            </Text>
            <View style={styles.heroPills}>
              <View style={styles.semesterPill}>
                <Ionicons name="calendar-outline" size={13} color={brand.gold} />
                <Text style={styles.semesterPillText}>{semester}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
          <View style={[styles.sectionHeader, isCompactPreview && styles.sectionHeaderCompact]}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="notifications-outline" size={19} color={colors.primary} />
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
            <>
              <FlatList
                data={notifications}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.id || 'notification'}-${index}`}
                snapToInterval={notificationSnapInterval}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.notificationCarouselContent}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / notificationSnapInterval);
                  setActiveNotificationIndex(Math.min(Math.max(nextIndex, 0), notifications.length - 1));
                }}
                renderItem={({ item }) => {
                  const icon = getNotificationIcon(item.type, colors);
                  const hasImage = hasValidImageUrl(item.imageUrl);

                  return (
                    <TouchableOpacity
                      style={[
                        styles.notificationCard,
                        hasImage && styles.notificationCardWithImage,
                        {
                          width: notificationCardWidth,
                          backgroundColor: item.isRead ? colors.background : colors.accentTint,
                          borderColor: item.isRead ? colors.border : colors.accent
                        }
                      ]}
                      activeOpacity={0.82}
                      onPress={() => setSelectedNotification(item)}
                    >
                      {hasImage && (
                        <View style={[styles.notificationCardImageFrame, { width: notificationCardWidth, backgroundColor: colors.background }]}>
                          <Image source={{ uri: item.imageUrl }} style={styles.notificationCardImage} resizeMode="contain" />
                        </View>
                      )}
                      <View style={styles.notificationCardHeader}>
                        <View style={[styles.notificationIcon, { backgroundColor: `${icon.color}22` }]}>
                          <Ionicons name={icon.name} size={18} color={icon.color} />
                        </View>
                        <View style={styles.notificationMeta}>
                          <Text style={[styles.notificationType, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.type || 'Campus Alert'}
                          </Text>
                          <Text style={[styles.notificationDate, { color: colors.textSecondary }]}>{item.date}</Text>
                        </View>
                        <Ionicons name="chevron-forward-circle" size={20} color={item.isRead ? colors.textSecondary : colors.primary} />
                      </View>

                      <Text style={[styles.notificationTitle, { color: item.isRead ? colors.text : colors.primary }]} numberOfLines={2}>{item.title}</Text>
                      <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={3}>{item.message}</Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {notifications.length > 1 && (
                <View style={styles.paginationDots}>
                  {notifications.map((item, index) => (
                    <View
                      key={`${item.id || 'notification-dot'}-${index}`}
                      style={[
                        styles.paginationDot,
                        {
                          backgroundColor: index === activeNotificationIndex ? colors.primary : colors.border,
                          opacity: index === activeNotificationIndex ? 1 : 0.75
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Ionicons name="pricetag-outline" size={19} color={colors.accentInk} />
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
                  <View style={[styles.dealCard, { width: isCompactPreview ? 214 : 260, backgroundColor: colors.cardBackground, borderColor: isAdSlot ? colors.border : colors.border }, !isDarkTheme && shadow.card, isAdSlot && styles.adSlotCard]}>
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
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {hasValidImageUrl(selectedDeal?.bannerImageUrl) ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setFullscreenImage({ imageUrl: selectedDeal.bannerImageUrl, title: selectedDeal.vendorName })}
              >
                <View style={[styles.modalImageFrame, { backgroundColor: colors.background }]}>
                  <Image source={{ uri: selectedDeal.bannerImageUrl }} style={styles.modalImage} resizeMode="contain" />
                </View>
                <View style={[styles.imageHintRow, { backgroundColor: colors.background }]}>
                  <Ionicons name="expand-outline" size={14} color={colors.primary} />
                  <Text style={[styles.imageHintText, { color: colors.textSecondary }]}>Tap image to view full size</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.modalImageFrame, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
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
                  <Text style={[styles.closeButtonText, { color: isDarkTheme ? '#1A1400' : '#FFFFFF' }]}>Visit Website</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surfaceAlt, marginTop: selectedDeal?.websiteUrl ? 12 : 24 }]}
                onPress={() => setSelectedDeal(null)}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NotificationDetailModal
        visible={!!selectedNotification}
        notification={selectedNotification}
        colors={colors}
        isDarkTheme={isDarkTheme}
        onClose={() => setSelectedNotification(null)}
        onOpenImage={setFullscreenImage}
      />

      <FullscreenImageViewer
        visible={!!fullscreenImage}
        imageUrl={fullscreenImage?.imageUrl}
        title={fullscreenImage?.title}
        onClose={() => setFullscreenImage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  utilityHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 56,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerDock: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    zIndex: 5,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: brand.navy,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroRing: {
    position: 'absolute',
    right: -40,
    top: -56,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 24,
    borderColor: 'rgba(255,210,1,0.13)',
  },
  heroCopy: { flex: 1, paddingRight: 0 },
  heroCopyCompact: { paddingRight: 0, width: '100%' },
  heroEyebrow: {
    color: brand.gold,
    fontSize: 10.5,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 21, fontFamily: fonts.extraBold, lineHeight: 25, marginBottom: 4, color: '#FFFFFF', letterSpacing: -0.2 },
  heroTitleCompact: { fontSize: 19, lineHeight: 23 },
  heroGreeting: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 18, marginBottom: 12, color: brand.onNavySecondary },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  semesterPill: {
    backgroundColor: brand.goldTint,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  semesterPillText: { color: brand.gold, fontSize: 11, fontFamily: fonts.bold },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 8 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold, marginLeft: 8 },
  cardDescription: { fontSize: 13.5, fontFamily: fonts.regular, lineHeight: 21 },
  textButton: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  textButtonLabel: { fontSize: 12.5, fontFamily: fonts.bold },
  notificationCarouselContent: { paddingRight: 6 },
  notificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    padding: 14,
    minHeight: 142,
    overflow: 'hidden',
  },
  notificationCardWithImage: {
    paddingTop: 0,
  },
  notificationCardImageFrame: {
    height: 116,
    marginHorizontal: -14,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCardImage: {
    width: '100%',
    height: '100%',
  },
  notificationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationMeta: { flex: 1, paddingRight: 8 },
  notificationType: { fontSize: 10.5, fontFamily: fonts.bold, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  notificationTitle: { fontSize: 14.5, fontFamily: fonts.bold, marginBottom: 6, lineHeight: 20 },
  notificationMessage: { fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 18 },
  notificationDate: { fontSize: 11, fontFamily: fonts.semiBold },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  carouselContainer: { marginBottom: 20 },
  carouselHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 5 },
  carouselTitle: { fontSize: 16, fontFamily: fonts.bold, marginLeft: 8 },
  dealCard: {
    borderRadius: radii.lg,
    marginRight: 15,
    width: 260,
    borderWidth: 1,
    overflow: 'hidden',
  },
  adSlotCard: { borderStyle: 'dashed' },
  dealImage: { width: '100%', height: 110 },
  dealTextContainer: { padding: 12 },
  dealVendorName: { fontSize: 14.5, fontFamily: fonts.bold, marginBottom: 4 },
  dealOfferText: { fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 18 },
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
  modalImageFrame: {
    width: '100%',
    height: 220,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  notificationModalContent: {
    flexShrink: 1,
  },
  notificationModalImageFrame: {
    width: '100%',
    height: 220,
  },
  notificationModalImage: {
    width: '100%',
    height: '100%',
  },
  imageHintRow: {
    minHeight: 34,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalTextContainer: {
    padding: 24,
  },
  notificationModalTextContainer: {
    padding: 24,
    flexShrink: 1,
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
  notificationModalMessageBody: {
    flexShrink: 1,
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
