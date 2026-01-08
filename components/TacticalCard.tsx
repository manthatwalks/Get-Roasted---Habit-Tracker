// components/TacticalCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

interface TacticalCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'success' | 'warning';
  noPadding?: boolean;
}

export default function TacticalCard({ 
  children, 
  style, 
  variant = 'default',
  noPadding = false 
}: TacticalCardProps) {
  const borderColor = 
    variant === 'success' ? Colors.success :
    variant === 'warning' ? Colors.streak :
    Colors.border;

  return (
    <View style={[
      styles.card,
      { borderColor },
      noPadding && styles.noPadding,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  noPadding: {
    padding: 0,
  },
});
