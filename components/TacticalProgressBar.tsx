// components/TacticalProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface TacticalProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}

export default function TacticalProgressBar({
  completed,
  total,
  showLabel = true,
}: TacticalProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>DAILY PROGRESS</Text>
          <Text style={styles.countText}>
            <Text style={styles.countHighlight}>{completed}</Text>
            <Text style={styles.countDivider}>/</Text>
            <Text>{total}</Text>
          </Text>
        </View>
      )}
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percentage}%` }]} />
        </View>
        {/* Tick marks for tactical look */}
        <View style={styles.tickContainer}>
          {Array.from({ length: total }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.tick,
                index < completed && styles.tickFilled,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  countHighlight: {
    color: Colors.gold,
    fontWeight: '700',
  },
  countDivider: {
    color: Colors.textMuted,
    marginHorizontal: 2,
  },
  trackContainer: {
    position: 'relative',
  },
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  tickContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 2,
  },
  tick: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tickFilled: {
    backgroundColor: 'transparent',
  },
});
