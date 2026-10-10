import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { styles } from './GlassPanel.styles';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  borderRadius?: number;
  overlayColor?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, style, intensity = 60, borderRadius, overlayColor }) => {
  return (
    <View style={[styles.container, borderRadius ? { borderRadius } : null, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.overlay, overlayColor ? { backgroundColor: overlayColor } : null, borderRadius ? { borderRadius } : null]} />
      {children}
    </View>
  );
};
