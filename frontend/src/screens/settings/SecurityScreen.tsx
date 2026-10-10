import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { tokens } from '../../theme/tokens';

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

const styles = StyleSheet.create({
  card: { padding: 28, alignItems: 'center' },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: tokens.colors.emeraldTint,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    width: 56,
  },
  title: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingMedium, fontSize: 17 },
  body: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
