import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const hasValidImageUrl = (imageUrl) => (
  typeof imageUrl === 'string' &&
  imageUrl.trim().length > 5 &&
  imageUrl.trim() !== 'null'
);

export default function NotificationDetailModal({ visible, notification, colors, onClose, onOpenImage }) {
  const imageUrl = notification?.imageUrl;
  const hasImage = hasValidImageUrl(imageUrl);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {hasImage && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onOpenImage?.({ imageUrl, title: notification?.title })}
            >
              <View style={[styles.notificationModalImageFrame, { backgroundColor: colors.background }]}>
                <Image source={{ uri: imageUrl }} style={styles.notificationModalImage} resizeMode="contain" />
              </View>
              <View style={[styles.imageHintRow, { backgroundColor: colors.background }]}>
                <Ionicons name="expand-outline" size={14} color={colors.primary} />
                <Text style={[styles.imageHintText, { color: colors.textSecondary }]}>Tap image to view full size</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.notificationModalTextContainer}>
            <View style={styles.notificationModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, flex: 1 }]}>{notification?.title}</Text>
              {notification?.type && (
                <View style={[styles.typeBadge, { borderColor: colors.border }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>{notification.type}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.modalDate, { color: colors.textSecondary }]}>{notification?.fullDate || notification?.date}</Text>
            <ScrollView style={styles.notificationModalMessageBody}>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{notification?.message}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  notificationModalTextContainer: {
    padding: 24,
    flexShrink: 1,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
    marginTop: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
