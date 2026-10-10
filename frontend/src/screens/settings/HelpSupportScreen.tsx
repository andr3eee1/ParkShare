import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { tokens } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const channels: { icon: IconName; label: string; value: string; href: string }[] = [
  { icon: 'mail-outline', label: 'Email Support', value: 'tibi.enache2010@gmail.com', href: 'mailto:tibi.enache2010@gmail.com' },
  { icon: 'call-outline', label: 'Phone Support', value: '0770 240 139', href: 'tel:0770240139' },
];

export const HelpSupportScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="Help & Support" subtitle="We're here to help" />

      {channels.map((channel) => (
        <TouchableOpacity
          key={channel.label}
          activeOpacity={0.8}
          onPress={() => Linking.openURL(channel.href)}
        >
          <GlassPanel style={styles.card} borderRadius={18} intensity={40} overlayColor={tokens.colors.panelSurface}>
            <View style={styles.iconContainer}>
              <Ionicons name={channel.icon} size={24} color={tokens.colors.emerald} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>{channel.label}</Text>
              <Text style={styles.valueText}>{channel.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.colors.secondaryText} />
          </GlassPanel>
        </TouchableOpacity>
      ))}

      <Text style={styles.footerText}>We are available Monday to Friday, 9:00 AM - 5:00 PM.</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', padding: 18, marginBottom: 14 },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: tokens.colors.emeraldTint,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 14,
    width: 44,
  },
  textContainer: { flex: 1 },
  label: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, marginBottom: 3 },
  valueText: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodySemiBold, fontSize: 15 },
  footerText: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
