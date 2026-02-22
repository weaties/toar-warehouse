import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
} from 'react-native';
import { IconButton } from 'react-native-paper';

interface Props {
  photoUrls: string[];
  onDelete?: (url: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PhotoStrip({ photoUrls, onDelete }: Props) {
  const [viewing, setViewing] = useState<string | null>(null);

  if (photoUrls.length === 0) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
      >
        {photoUrls.map((url) => (
          <TouchableOpacity
            key={url}
            onPress={() => setViewing(url)}
            style={styles.thumbContainer}
          >
            <Image source={{ uri: url }} style={styles.thumb} />
            {onDelete ? (
              <IconButton
                icon="close-circle"
                size={18}
                iconColor="#fff"
                style={styles.deleteBtn}
                onPress={() => onDelete(url)}
              />
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={!!viewing}
        transparent
        animationType="fade"
        onRequestClose={() => setViewing(null)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setViewing(null)}
          >
            <IconButton icon="close" iconColor="#fff" size={28} />
          </TouchableOpacity>
          {viewing ? (
            <Image
              source={{ uri: viewing }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginVertical: 8,
  },
  stripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbContainer: {
    position: 'relative',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  deleteBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
