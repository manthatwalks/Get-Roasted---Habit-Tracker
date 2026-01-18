// components/ApexSuccessScreen.tsx
// Tactical Success/Victory Screen - Larger image container

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ApexSuccessScreenProps {
  visible: boolean;
  streak: number;
  habitName: string;
  roastMessage: string;
  onClose: () => void;
}

export default function ApexSuccessScreen({
  visible,
  streak,
  habitName,
  roastMessage,
  onClose,
}: ApexSuccessScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      streakAnim.setValue(0);

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(streakAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <Text style={styles.statusText}>VERIFIED</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.statusText}>LOGGED</Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* Mission Complete Header */}
            <View style={styles.header}>
              <Text style={styles.missionLabel}>MISSION</Text>
              <Text style={styles.completeLabel}>COMPLETE</Text>
            </View>

            {/* Streak Display */}
            <Animated.View
              style={[
                styles.streakContainer,
                {
                  transform: [
                    { scale: streakAnim },
                    { scale: pulseAnim },
                  ],
                },
              ]}
            >
              <View style={styles.streakRing}>
                <View style={styles.streakInner}>
                  <Text style={styles.streakNumber}>{streak}</Text>
                  <Text style={styles.streakUnit}>DAY</Text>
                </View>
              </View>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={20} color={Colors.streak} />
              </View>
            </Animated.View>

            {/* Character Image - LARGER */}
            <Animated.View
              style={[
                styles.imageContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Image
                source={require('../assets/images/apex-pleased.png')}
                style={styles.characterImage}
                resizeMode="cover"
              />
            </Animated.View>

            {/* Message Card */}
            <View style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <Text style={styles.habitName}>{habitName.toUpperCase()}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={Colors.background} />
                </View>
              </View>
              <View style={styles.messageDivider} />
              <Text style={styles.roastMessage}>"{roastMessage}"</Text>
              <Text style={styles.attribution}>— THE APEX LAD</Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueText}>CONTINUE</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  statusDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  missionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  completeLabel: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 6,
    marginTop: -4,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  streakRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldMuted,
  },
  streakInner: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
  },
  streakUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: -4,
  },
  streakBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.streak,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    height: 220,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  messageCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  habitName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  roastMessage: {
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  attribution: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.button,
    gap: Spacing.sm,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: 2,
  },
});