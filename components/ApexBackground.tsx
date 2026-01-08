// components/ApexBackground.tsx
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ApexBackgroundProps {
  children: React.ReactNode;
}

export default function ApexBackground({ children }: ApexBackgroundProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/apex-lad.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.gradientOverlay} />
      <View style={styles.uiLayer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0604',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    width: SCREEN_WIDTH,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    backgroundColor: 'rgba(10, 6, 4, 0.05)',
  },
  uiLayer: {
    flex: 1,
  },
});