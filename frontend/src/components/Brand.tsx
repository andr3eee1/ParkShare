import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../theme/tokens';

interface BrandGradientProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the brighter hero variant instead of the standard brand gradient. */
  bright?: boolean;
}

/**
 * The brand gradient surface — emerald 500 → emerald 700, matching the app
 * icon. Used for hero headers, auth backgrounds and tinted cards so the
 * signature green is present across the whole app.
 */
export const BrandGradient: React.FC<BrandGradientProps> = ({ children, style, bright = false }) => (
  <LinearGradient
    colors={bright ? tokens.gradients.brandBright : tokens.gradients.brand}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);
