// components/ApexPanel.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ApexPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'dark' | 'parchment';
}

export default function ApexPanel({ children, style, variant = 'dark' }: ApexPanelProps) {
  return (
    <View style={[
      styles.panel,
      variant === 'parchment' && styles.parchmentPanel,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(42, 24, 16, 0.92)',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  parchmentPanel: {
    backgroundColor: 'rgba(244, 231, 215, 0.95)',
    borderColor: 'rgba(139, 69, 19, 0.5)',
  },
});