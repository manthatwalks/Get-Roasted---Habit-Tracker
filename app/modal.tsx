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
          <View style={styles.imageContainer}>
            <Image
              source={moodImages[mood]}
              style={styles.characterImage}
              resizeMode="cover"
            />
          </View>
          
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
    padding: 20,
  },
  container: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#1a1210',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#0a0604',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#f4e7d7',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 150,
  },
  buttonHalf: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0604',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});