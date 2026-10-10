import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, ScreenHeader } from '../components/Screen';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { apiClient } from '../api/client';
import { tokens } from '../theme/tokens';

type AccountStatus = 'ACTIVE' | 'WARNING' | 'SUSPENDED' | 'BANNED';

type Standing = {
  status: AccountStatus;
  suspendedUntil: string | null;
  warningCount: number;
  driverScore: number;
  driverReviews: number;
  hostScore: number;
  hostReviews: number;
  recentLowRatings: number;
  completedBookings: number;
};

type ModerationAction = { id: string; action: string; reason?: string | null; createdAt: string };
type Notification = { id: string; type: string; title: string; body?: string | null; read: boolean; createdAt: string };

const STATUS_META: Record<AccountStatus, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap; blurb: string }> = {
  ACTIVE: {
    label: 'Good standing',
    color: tokens.colors.availabilityGreen,
    bg: tokens.colors.emeraldTint,
    icon: 'shield-checkmark',
    blurb: 'Your account is in good standing. Keep it up!',
  },
  WARNING: {
    label: 'Warning',
    color: tokens.colors.warningAmber,
    bg: '#FEF3C7',
    icon: 'warning',
    blurb: 'Your rating is below our community standard. Improve it to avoid a suspension.',
  },
  SUSPENDED: {
    label: 'Suspended',
    color: tokens.colors.warningAmber,
    bg: '#FEF3C7',
    icon: 'pause-circle',
    blurb: 'New bookings are paused for a short cooldown. You can appeal below.',
  },
  BANNED: {
    label: 'Banned',
    color: tokens.colors.danger,
    bg: '#FDECEC',
    icon: 'close-circle',
    blurb: 'Your account has been banned. You can submit an appeal for review.',
  },
};

const ACTION_LABELS: Record<string, string> = {
  WARN: 'Warning issued',
  SUSPEND: 'Suspended',
  BAN: 'Banned',
  REINSTATE: 'Reinstated',
  AUTO_WARN: 'Automatic warning',
  AUTO_SUSPEND: 'Automatic suspension',
  AUTO_REINSTATE: 'Automatically reinstated',
};

const formatDate = (value: string) => new Date(value).toLocaleString();

export const StandingScreen = () => {
  const { user, updateUser } = useContext(AuthContext);
  const { alert } = useAlert();
  const [standing, setStanding] = useState<Standing | null>(null);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingAppeal, setPendingAppeal] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [standingRes, notificationsRes] = await Promise.all([
        apiClient.get('/moderation/standing'),
        apiClient.get('/moderation/notifications'),
      ]);
      setStanding(standingRes.data.standing);
      setActions(standingRes.data.recentActions || []);
      setPendingAppeal(standingRes.data.pendingAppeal || null);
      setNotifications(notificationsRes.data.notifications || []);
    } catch (err) {
      console.warn('Failed to load standing', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.post('/moderation/notifications/read-all');
    } catch {
      // Non-fatal
    }
  };

  const submitAppeal = async () => {
    const message = appealText.trim();
    if (message.length < 10) {
      alert('Too short', 'Please describe your situation in at least 10 characters.', undefined, 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/moderation/appeals', { message });
      setAppealText('');
      alert('Appeal submitted', 'Our team will review your appeal and respond in the app.', undefined, 'success');
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      alert('Could not submit', typeof msg === 'string' ? msg : 'Please try again.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = standing ? STATUS_META[standing.status] : STATUS_META.ACTIVE;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Screen>
      <ScreenHeader title="Trust & Safety" subtitle="Your standing, ratings, and notices" />

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={tokens.colors.municipalTeal} /></View>
        ) : (
          <>
            {/* Status card */}
            <GlassPanel style={styles.statusCard} borderRadius={20} intensity={45} overlayColor={tokens.colors.panelSurface}>
              <View style={[styles.statusIcon, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={26} color={meta.color} />
              </View>
              <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
              <Text style={styles.statusBlurb}>{meta.blurb}</Text>
              {standing?.status === 'SUSPENDED' && standing.suspendedUntil && (
                <Text style={styles.suspensionText}>Suspended until {formatDate(standing.suspendedUntil)}</Text>
              )}
              {standing && standing.warningCount > 0 && (
                <Text style={styles.warningText}>{standing.warningCount} warning{standing.warningCount === 1 ? '' : 's'} on record</Text>
              )}
            </GlassPanel>

            {/* Scores */}
            <View style={styles.scoresRow}>
              <GlassPanel style={styles.scoreCard} borderRadius={16} intensity={35} overlayColor={tokens.colors.panelSurface}>
                <Text style={styles.scoreValue}>{(standing?.driverScore ?? 5).toFixed(2)}</Text>
                <View style={styles.scoreLabelRow}>
                  <Ionicons name="car-outline" size={14} color={tokens.colors.secondaryText} />
                  <Text style={styles.scoreLabel}>As a driver</Text>
                </View>
                <Text style={styles.scoreMeta}>{standing?.driverReviews ?? 0} reviews</Text>
              </GlassPanel>
              <GlassPanel style={styles.scoreCard} borderRadius={16} intensity={35} overlayColor={tokens.colors.panelSurface}>
                <Text style={styles.scoreValue}>{(standing?.hostScore ?? 5).toFixed(2)}</Text>
                <View style={styles.scoreLabelRow}>
                  <Ionicons name="home-outline" size={14} color={tokens.colors.secondaryText} />
                  <Text style={styles.scoreLabel}>As a host</Text>
                </View>
                <Text style={styles.scoreMeta}>{standing?.hostReviews ?? 0} reviews</Text>
              </GlassPanel>
            </View>

            {/* Notifications */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notices</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={styles.sectionAction}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
            {notifications.length === 0 ? (
              <GlassPanel style={styles.emptyCard} borderRadius={16} overlayColor={tokens.colors.panelSurface}>
                <Ionicons name="notifications-off-outline" size={22} color={tokens.colors.secondaryText} />
                <Text style={styles.emptyText}>No notices yet.</Text>
              </GlassPanel>
            ) : (
              notifications.map((n) => (
                <GlassPanel key={n.id} style={styles.noticeCard} borderRadius={14} overlayColor={tokens.colors.panelSurface}>
                  <View style={[styles.noticeDot, { backgroundColor: n.read ? '#D1D5DB' : tokens.colors.municipalTeal }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeTitle}>{n.title}</Text>
                    {!!n.body && <Text style={styles.noticeBody}>{n.body}</Text>}
                    <Text style={styles.noticeDate}>{formatDate(n.createdAt)}</Text>
                  </View>
                </GlassPanel>
              ))
            )}

            {/* Recent moderation actions */}
            {actions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 22 }]}>History</Text>
                {actions.map((a) => (
                  <View key={a.id} style={styles.actionRow}>
                    <Ionicons name="time-outline" size={15} color={tokens.colors.secondaryText} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.actionTitle}>{ACTION_LABELS[a.action] || a.action}</Text>
                      {!!a.reason && <Text style={styles.actionReason}>{a.reason}</Text>}
                      <Text style={styles.actionDate}>{formatDate(a.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Appeal */}
            {(standing?.status === 'SUSPENDED' || standing?.status === 'BANNED') && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Appeal</Text>
                {pendingAppeal ? (
                  <GlassPanel style={styles.appealPending} borderRadius={14} overlayColor={tokens.colors.panelSurface}>
                    <Ionicons name="hourglass-outline" size={20} color={tokens.colors.warningAmber} />
                    <Text style={styles.appealPendingText}>Your appeal is under review. We'll notify you here.</Text>
                  </GlassPanel>
                ) : (
                  <GlassPanel style={styles.appealCard} borderRadius={16} overlayColor={tokens.colors.panelSurface}>
                    <Text style={styles.appealHelp}>Think this is a mistake? Tell us what happened and an admin will review it.</Text>
                    <TextInput
                      style={styles.appealInput}
                      value={appealText}
                      onChangeText={setAppealText}
                      placeholder="Explain your situation..."
                      placeholderTextColor={tokens.colors.secondaryText}
                      multiline
                      editable={!submitting}
                    />
                    <TouchableOpacity style={[styles.appealButton, submitting && { opacity: 0.6 }]} onPress={submitAppeal} disabled={submitting}>
                      {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.appealButtonText}>Submit appeal</Text>}
                    </TouchableOpacity>
                  </GlassPanel>
                )}
              </>
            )}
          </>
        )}
      </Screen>
  );
};

const styles = StyleSheet.create({
  loading: { paddingTop: 60, alignItems: 'center' },
  statusCard: { padding: 22, alignItems: 'center' },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontFamily: tokens.typography.headingBold, fontSize: 20, marginTop: 12 },
  statusBlurb: { fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  suspensionText: { fontFamily: tokens.typography.bodyMedium, fontSize: 13, color: tokens.colors.warningAmber, marginTop: 8 },
  warningText: { fontFamily: tokens.typography.body, fontSize: 12, color: tokens.colors.secondaryText, marginTop: 4 },
  scoresRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  scoreCard: { flex: 1, padding: 16, alignItems: 'center' },
  scoreValue: { fontFamily: tokens.typography.headingBold, fontSize: 26, color: tokens.colors.primaryText },
  scoreLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  scoreLabel: { fontFamily: tokens.typography.bodyMedium, fontSize: 12, color: tokens.colors.primaryText, marginLeft: 5 },
  scoreMeta: { fontFamily: tokens.typography.body, fontSize: 11, color: tokens.colors.secondaryText, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontFamily: tokens.typography.headingMedium, fontSize: 18, color: tokens.colors.primaryText, marginBottom: 10 },
  sectionAction: { fontFamily: tokens.typography.bodyMedium, fontSize: 12, color: tokens.colors.municipalTeal },
  emptyCard: { padding: 20, alignItems: 'center', flexDirection: 'row', gap: 10 },
  emptyText: { fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText },
  noticeCard: { flexDirection: 'row', padding: 14, marginBottom: 10 },
  noticeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 10 },
  noticeTitle: { fontFamily: tokens.typography.bodySemiBold, fontSize: 14, color: tokens.colors.primaryText },
  noticeBody: { fontFamily: tokens.typography.body, fontSize: 12, color: tokens.colors.secondaryText, marginTop: 3, lineHeight: 17 },
  noticeDate: { fontFamily: tokens.typography.body, fontSize: 10, color: '#9CA3AF', marginTop: 5 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  actionTitle: { fontFamily: tokens.typography.bodySemiBold, fontSize: 13, color: tokens.colors.primaryText },
  actionReason: { fontFamily: tokens.typography.body, fontSize: 12, color: tokens.colors.secondaryText, marginTop: 2 },
  actionDate: { fontFamily: tokens.typography.body, fontSize: 10, color: '#9CA3AF', marginTop: 3 },
  appealCard: { padding: 16 },
  appealHelp: { fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText, lineHeight: 19 },
  appealInput: {
    marginTop: 12, minHeight: 90, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12,
    fontFamily: tokens.typography.body, fontSize: 14, color: tokens.colors.primaryText, textAlignVertical: 'top',
  },
  appealButton: { marginTop: 12, backgroundColor: tokens.colors.emerald, borderRadius: 12, padding: 14, alignItems: 'center' },
  appealButtonText: { color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 15 },
  appealPending: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appealPendingText: { fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText, flex: 1 },
});
