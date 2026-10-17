import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { useAlert } from '../../context/AlertContext';
import { tokens } from '../../theme/tokens';

type Notification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  read: boolean;
  createdAt: string;
};

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  APPEAL: 'chatbubble-ellipses-outline',
  REINSTATE: 'shield-checkmark-outline',
  SANCTION: 'warning-outline',
  STANDING_WARNING: 'alert-circle-outline',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString();
};

export const NotificationsScreen = () => {
  const { alert } = useAlert();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/moderation/notifications');
      setNotifications(response.data.notifications || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const markAsRead = async (notification: Notification) => {
    if (notification.read || markingId || markingAll) return;

    setMarkingId(notification.id);
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, read: true } : item
    )));

    try {
      await apiClient.post(`/moderation/notifications/${notification.id}/read`);
    } catch {
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read: false } : item
      )));
      alert('Could not update notification', 'Please try again.', undefined, 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.every((notification) => notification.read) || markingId || markingAll) return;

    const previousNotifications = notifications;
    setMarkingAll(true);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));

    try {
      await apiClient.post('/moderation/notifications/read-all');
    } catch {
      setNotifications(previousNotifications);
      alert('Could not update notifications', 'Please try again.', undefined, 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadNotifications(true)}
          tintColor={tokens.colors.municipalTeal}
          colors={[tokens.colors.municipalTeal]}
        />
      }
    >
      <ScreenHeader title="Notifications" subtitle="Stay up to date with your ParkShare activity" />

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={tokens.colors.municipalTeal} />
          <Text style={styles.stateText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <GlassPanel style={styles.stateCard} borderRadius={20} overlayColor={tokens.colors.panelSurface}>
          <View style={[styles.iconWrap, styles.errorIconWrap]}>
            <Ionicons name="cloud-offline-outline" size={26} color="#C24141" />
          </View>
          <Text style={styles.title}>Notifications unavailable</Text>
          <Text style={styles.body}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void loadNotifications()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading notifications"
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </GlassPanel>
      ) : notifications.length === 0 ? (
        <GlassPanel style={styles.stateCard} borderRadius={20} intensity={40} overlayColor={tokens.colors.panelSurface}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications-off-outline" size={26} color={tokens.colors.municipalTeal} />
          </View>
          <Text style={styles.title}>You're all caught up</Text>
          <Text style={styles.body}>Important account and safety updates will appear here.</Text>
        </GlassPanel>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={() => void markAllAsRead()}
                disabled={markingAll}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
              >
                {markingAll ? (
                  <ActivityIndicator size="small" color={tokens.colors.municipalTeal} />
                ) : (
                  <Text style={styles.sectionAction}>Mark all read</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              activeOpacity={0.8}
              onPress={() => void markAsRead(notification)}
              disabled={markingAll || markingId === notification.id}
              accessibilityRole="button"
              accessibilityLabel={`${notification.title}${notification.read ? '' : ', unread'}`}
            >
              <GlassPanel
                style={notification.read ? styles.notificationCard : [styles.notificationCard, styles.unreadCard]}
                borderRadius={16}
                overlayColor={tokens.colors.panelSurface}
              >
                <View style={[styles.notificationIcon, !notification.read && styles.unreadIcon]}>
                  <Ionicons
                    name={NOTIFICATION_ICONS[notification.type] || 'notifications-outline'}
                    size={20}
                    color={notification.read ? tokens.colors.secondaryText : tokens.colors.municipalTeal}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                      {notification.title}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  {!!notification.body && <Text style={styles.notificationBody}>{notification.body}</Text>}
                  <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>
                </View>
                {markingId === notification.id && <ActivityIndicator size="small" color={tokens.colors.municipalTeal} />}
              </GlassPanel>
            </TouchableOpacity>
          ))}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  stateCard: { alignItems: 'center', padding: 28 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E8F1F5',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    width: 56,
  },
  errorIconWrap: { backgroundColor: '#FDECEC' },
  title: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingMedium, fontSize: 17 },
  body: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: tokens.colors.primaryText,
    borderRadius: 10,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: tokens.colors.white, fontFamily: tokens.typography.bodySemiBold, fontSize: 13 },
  stateText: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, marginTop: 10 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingMedium, fontSize: 16 },
  sectionAction: { color: tokens.colors.municipalTeal, fontFamily: tokens.typography.bodySemiBold, fontSize: 13 },
  notificationCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  unreadCard: { borderColor: tokens.colors.municipalTeal },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF2F5',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  unreadIcon: { backgroundColor: '#E8F1F5' },
  notificationContent: { flex: 1 },
  notificationTitleRow: { alignItems: 'center', flexDirection: 'row' },
  notificationTitle: { color: tokens.colors.primaryText, flex: 1, fontFamily: tokens.typography.bodySemiBold, fontSize: 15 },
  unreadTitle: { fontFamily: tokens.typography.headingMedium },
  unreadDot: { backgroundColor: tokens.colors.municipalTeal, borderRadius: 4, height: 8, marginLeft: 8, width: 8 },
  notificationBody: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, lineHeight: 19, marginTop: 5 },
  notificationDate: { color: '#8A98A4', fontFamily: tokens.typography.body, fontSize: 11, marginTop: 8 },
});
