import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { tokens } from '../../theme/tokens';
import { styles } from './SecurityScreen.styles';

export const SecurityScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="Security" subtitle="Password and account protection" />

      <GlassPanel style={styles.card} borderRadius={20} intensity={40} overlayColor={tokens.colors.panelSurface}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={26} color={tokens.colors.emerald} />
        </View>
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.body}>Password and two-factor authentication settings will land here soon.</Text>
      </GlassPanel>
    </Screen>
  );
};
