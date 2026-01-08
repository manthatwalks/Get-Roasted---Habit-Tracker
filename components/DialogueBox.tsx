// components/DialogueBox.tsx
// Visual Novel / Akinator Style Dialogue Box

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface DialogueBoxProps {
  message: string;
  completedCount?: number;
  totalCount?: number;
  showStats?: boolean;
}

export default function DialogueBox({ 
  message, 
  completedCount = 0, 
  totalCount = 0,
  showStats = true 
}: DialogueBoxProps) {
  return (
    <View style={styles.container}>
      {/* Nameplate */}
      <View style={styles.nameplate}>
        <Text style={styles.nameplateText}>APEX LAD</Text>
      </View>
      
      {/* Dialogue Content */}
      <View style={styles.dialogueContent}>
        {/* Stats Badge (top right corner) */}
        {showStats && totalCount > 0 && (
          <View style={styles.statsBadge}>
            <Ionicons name="flame" size={14} color={Colors.streak} />
            <Text style={styles.statsText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        )}
        
        {/* Main Message */}
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    ...Shadows.dialogue,
  },
  nameplate: {
    position: 'absolute',
    top: -12,
    left: Spacing.lg,
    backgroundColor: Colors.nameplateBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    zIndex: 10,
  },
  nameplateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.nameplateText,
    letterSpacing: 2,
  },
  dialogueContent: {
    backgroundColor: Colors.dialogueBackground,
    borderWidth: 2,
    borderColor: Colors.dialogueBorder,
    borderRadius: BorderRadius.dialogue,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 80,
  },
  statsBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.streak,
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 24,
    paddingRight: 60, // Space for stats badge
  },
});
