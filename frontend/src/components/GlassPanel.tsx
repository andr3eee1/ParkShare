import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '../theme/tokens';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  borderRadius?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, style, intensity = 60, borderRadius }) => {
  return (
    <View style={[styles.container, borderRadius ? { borderRadius } : null, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.overlay, borderRadius ? { borderRadius } : null]} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  overlay: {
    backgroundColor: tokens.colors.transparentWhite,
  },
});
