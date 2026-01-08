// components/SwipeableHabitCard.tsx
// Visual Novel Style Habit Card - FIXED solid backgrounds

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

const SWIPE_THRESHOLD = -80;

interface Habit {
  id: string;
  name: string;
  description: string;
  currentStreak: number;
  displayStreak: number;
}

interface SwipeableHabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onCheckIn: () => void;
  onDelete: () => void;
}

export default function SwipeableHabitCard({
  habit,
  isCompleted,
  onCheckIn,
  onDelete,
}: SwipeableHabitCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        } else if (isSwipedOpen.current) {
          translateX.setValue(Math.min(gestureState.dx - 80, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          isSwipedOpen.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          isSwipedOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    isSwipedOpen.current = false;
  };

  const handleDelete = () => {
    closeSwipe();
    onDelete();
  };

  const handlePress = () => {
    if (isSwipedOpen.current) {
      closeSwipe();
    } else if (!isCompleted) {
      onCheckIn();
    }
  };

  return (
    <View style={styles.container}>
      {/* Delete Button (behind card) */}
      <View style={styles.deleteContainer}>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Main Card - SOLID backgrounds */}
      <Animated.View
        style={[
          styles.card,
          isCompleted ? styles.cardCompleted : styles.cardIncomplete,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable style={styles.cardContent} onPress={handlePress}>
          {/* Left Side - Habit Info */}
          <View style={styles.habitInfo}>
            <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
              {habit.name}
            </Text>
            <Text style={styles.habitDescription} numberOfLines={1}>
              {isCompleted ? 'Completed' : habit.description}
            </Text>
          </View>

          {/* Right Side - Streak & Action */}
          <View style={styles.rightSection}>
            {/* Streak Badge */}
            <View style={[
              styles.streakBadge,
              habit.displayStreak > 0 && styles.streakBadgeActive
            ]}>
              <Ionicons 
                name="flame" 
                size={14} 
                color={habit.displayStreak > 0 ? Colors.streak : Colors.textMuted} 
              />
              <Text style={[
                styles.streakText,
                habit.displayStreak > 0 && styles.streakTextActive
              ]}>
                {habit.displayStreak}
              </Text>
            </View>

            {/* Action Button */}
            {isCompleted ? (
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark" size={20} color={Colors.success} />
              </View>
            ) : (
              <View style={styles.checkInButton}>
                <Ionicons name="camera-outline" size={20} color={Colors.buttonPrimaryText} />
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.card,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    ...Shadows.card,
  },
  cardIncomplete: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  cardCompleted: {
    backgroundColor: '#1F2A1C', // Solid dark green - NO transparency
    borderColor: Colors.completeBorder,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  habitInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  habitNameCompleted: {
    color: Colors.success,
  },
  habitDescription: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakBadgeActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.borderAccent,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  streakTextActive: {
    color: Colors.streak,
  },
  completedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2A1C', // Solid dark green
    borderWidth: 1,
    borderColor: Colors.completeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
});