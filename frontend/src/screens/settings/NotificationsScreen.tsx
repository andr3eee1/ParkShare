import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { tokens } from '../../theme/tokens';
import { styles } from './NotificationsScreen.styles';

export const NotificationsScreen = () => {
  return (
    <Screen>
      <ScreenHeader title="Notifications" subtitle="Push and email preferences" />

      <GlassPanel style={styles.card} borderRadius={20} intensity={40} overlayColor={tokens.colors.panelSurface}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications-outline" size={26} color={tokens.colors.emerald} />
        </View>
        <Text style={styles.title}>You're all caught up</Text>
        <Text style={styles.body}>Push and email alert settings will appear here soon.</Text>
      </GlassPanel>
    </Screen>
  );
};
