import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { tokens } from '../../theme/tokens';

export const NotificationsScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="Notifications" subtitle="Push and email preferences" />

      <GlassPanel style={styles.card} borderRadius={20} intensity={40} overlayColor={tokens.colors.panelSurface}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications-outline" size={26} color={tokens.colors.municipalTeal} />
        </View>
        <Text style={styles.title}>You're all caught up</Text>
        <Text style={styles.body}>Push and email alert settings will appear here soon.</Text>
      </GlassPanel>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: { padding: 28, alignItems: 'center' },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E8F1F5',
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
