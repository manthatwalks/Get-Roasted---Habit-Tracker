// components/HabitCard.tsx
// Simple habit card - tap to check-in, long-press to delete with themed modal

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../constants/theme';
import ApexModal from './ApexModal';

interface Habit {
  id: string;
  name: string;
  description: string;
  currentStreak: number;
  displayStreak: number;
}

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onCheckIn: () => void;
  onDelete: () => void;
}

export default function HabitCard({
  habit,
  isCompleted,
  onCheckIn,
  onDelete,
}: HabitCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePress = () => {
    if (!isCompleted) {
      onCheckIn();
    }
  };

  const handleLongPress = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isCompleted ? styles.cardCompleted : styles.cardIncomplete,
          pressed && styles.cardPressed,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
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

      {/* Delete Confirmation Modal */}
      <ApexModal
        visible={showDeleteModal}
        mood="talking"
        title="Throwing in the towel?"
        message={`You sure you want to bin "${habit.name}"? Once it's gone, it's gone mate. No coming back from this one.`}
        buttonText="Nah, keep it"
        onClose={() => setShowDeleteModal(false)}
        secondaryButtonText="Delete it"
        onSecondaryPress={handleConfirmDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    ...Shadows.card,
  },
  cardIncomplete: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  cardCompleted: {
    backgroundColor: '#1F2A1C',
    borderColor: Colors.completeBorder,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
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
    backgroundColor: '#1F2A1C',
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