import React from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function FullscreenImageViewer({ visible, imageUrl, title, onClose }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const imageViewportHeight = Math.max(height - insets.top - insets.bottom - 84, 240);

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            {!!title && (
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.82}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.zoomScroll}
          contentContainerStyle={styles.zoomContent}
          minimumZoomScale={1}
          maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
          bouncesZoom={true}
          centerContent={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {!!imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { width: width - 32, height: imageViewportHeight }]}
              resizeMode="contain"
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  zoomScroll: {
    flex: 1,
  },
  zoomContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    alignSelf: 'center',
  },
});
