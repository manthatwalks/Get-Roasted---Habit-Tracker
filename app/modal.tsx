// components/ApexModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH - 48;

type ApexMood = 'pleased' | 'talking';

interface ApexModalProps {
  visible: boolean;
  mood: ApexMood;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

const moodImages = {
  pleased: require('../assets/images/apex-pleased.png'),
  talking: require('../assets/images/apex-talking.png'),
};

export default function ApexModal({
  visible,
  mood,
  title,
  message,
  buttonText = 'OK',
  onClose,
  secondaryButtonText,
  onSecondaryPress,
}: ApexModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Character Image - Square aspect ratio */}
          <View style={styles.imageContainer}>
            <Image
              source={moodImages[mood]}
              style={styles.characterImage}
              resizeMode="contain"
            />
            {/* Success checkmark for pleased mood */}
            {mood === 'pleased' && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, secondaryButtonText && styles.buttonHalf]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>

              {secondaryButtonText && onSecondaryPress && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf, styles.deleteButton]}
                  onPress={() => {
                    onSecondaryPress();
                    onClose();
                  }}
                >
                  <Text style={styles.deleteButtonText}>{secondaryButtonText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: MODAL_WIDTH,
    backgroundColor: '#1a1210',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85, // Taller than wide to fit full character
    backgroundColor: '#0a0604',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  message: {
    fontSize: 15,
    color: '#f4e7d7',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a0604',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});