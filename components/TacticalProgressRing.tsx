// components/TacticalProgressRing.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface TacticalProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function TacticalProgressRing({
  percentage,
  size = 180,
  strokeWidth = 10,
  showLabel = true,
}: TacticalProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.gold}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.percentage}>{Math.round(percentage)}</Text>
          <Text style={styles.percentSign}>%</Text>
          <Text style={styles.subtitle}>COMPLETE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
  },
  percentSign: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: -8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
});
