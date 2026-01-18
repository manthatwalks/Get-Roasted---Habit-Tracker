// components/ApexModal.tsx
// Tactical Modal Component - Larger image container

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
import { Colors, BorderRadius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
          {/* Top Accent Line */}
          <View style={styles.topAccent} />

          {/* Header Icon */}
          <View style={styles.headerIcon}>
            <Ionicons 
              name={mood === 'pleased' ? 'checkmark-circle' : 'alert-circle'} 
              size={24} 
              color={mood === 'pleased' ? Colors.success : Colors.gold} 
            />
          </View>

          {/* Image Section - LARGER */}
          <View style={styles.imageContainer}>
            <Image
              source={moodImages[mood]}
              style={styles.characterImage}
              resizeMode="cover"
            />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, secondaryButtonText && styles.buttonHalf]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>

              {secondaryButtonText && onSecondaryPress && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf, styles.dangerButton]}
                  onPress={() => {
                    onSecondaryPress();
                    onClose();
                  }}
                >
                  <Text style={styles.dangerButtonText}>{secondaryButtonText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bottom Border */}
          <View style={styles.bottomBorder} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topAccent: {
    height: 3,
    backgroundColor: Colors.gold,
  },
  headerIcon: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surface,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 2,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: 1,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
    letterSpacing: 1,
  },
  bottomBorder: {
    height: 1,
    backgroundColor: Colors.border,
  },
});