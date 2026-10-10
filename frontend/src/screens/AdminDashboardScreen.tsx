import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../components/GlassPanel';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { adminApi } from '../api/client';

type IconName = keyof typeof Ionicons.glyphMap;

type Metric = {
  label: string;
  value: string;
  change: string;
  icon: IconName;
  color: string;
};

type QueueItem = {
  label: string;
  count: string;
  description: string;
  icon: IconName;
  color: string;
};

type Overview = {
  users: { total: number; changePercent: number };
  spaces: { live: number; change: number; unavailable: number };
  reservations: { today: number; grossVolume: number; byStatus: Record<string, number> };
  passes: { active: number };
  limitations: { reports: boolean; paymentReviews: boolean };
};

const managementAreas = [
  { label: 'Users', description: 'Accounts and roles', icon: 'people-outline' as IconName, route: 'AdminUsers' },
  { label: 'Parking spaces', description: 'Listings and approvals', icon: 'map-outline' as IconName, route: 'AdminSpaces' },
  { label: 'Bookings', description: 'Trips and payments', icon: 'receipt-outline' as IconName, route: 'AdminBookings' },
  { label: 'Reports', description: 'Trust and safety', icon: 'flag-outline' as IconName, route: 'AdminReports' },
];

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { token } = useContext(AuthContext);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const metricWidth = width >= 900 ? '23.5%' : '48%';

  useEffect(() => {
    if (!token) return;
    adminApi(token, '/admin/overview').then(setOverview).catch((requestError) => setError(requestError.message));
  }, [token]);

  const metrics: Metric[] = [
    { label: 'Active users', value: overview ? overview.users.total.toLocaleString() : '—', change: overview ? `${overview.users.changePercent >= 0 ? '+' : ''}${overview.users.changePercent}%` : 'Loading', icon: 'people-outline', color: tokens.colors.municipalTeal },
    { label: 'Live spaces', value: overview ? overview.spaces.live.toLocaleString() : '—', change: overview ? `${overview.spaces.change >= 0 ? '+' : ''}${overview.spaces.change}` : 'Loading', icon: 'business-outline', color: '#7C3AED' },
    { label: "Today's bookings", value: overview ? overview.reservations.today.toLocaleString() : '—', change: overview ? `${overview.reservations.byStatus.ACTIVE || 0} active` : 'Loading', icon: 'calendar-outline', color: tokens.colors.availabilityGreen },
    { label: 'Gross volume', value: overview ? `${overview.reservations.grossVolume.toLocaleString()} RON` : '—', change: overview ? `${overview.passes.active} active passes` : 'Loading', icon: 'cash-outline', color: tokens.colors.warningAmber },
  ];
  const queueItems: QueueItem[] = [
    { label: 'Unavailable spaces', count: overview ? String(overview.spaces.unavailable) : '—', description: 'Listings currently unavailable', icon: 'business-outline', color: tokens.colors.municipalTeal },
    { label: 'Active bookings', count: overview ? String(overview.reservations.byStatus.ACTIVE || 0) : '—', description: 'Reservations in progress', icon: 'calendar-outline', color: tokens.colors.availabilityGreen },
    { label: 'Active passes', count: overview ? String(overview.passes.active) : '—', description: 'Subscriptions currently active', icon: 'card-outline', color: tokens.colors.warningAmber },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={21} color={tokens.colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PARKSHARE OPERATIONS</Text>
            <Text style={styles.screenTitle}>Admin dashboard</Text>
            <Text style={styles.subtitle}>Keep the marketplace moving safely.</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark-outline" size={18} color={tokens.colors.municipalTeal} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        <View style={styles.mockNotice}>
          {overview ? <Ionicons name="cloud-done-outline" size={18} color={tokens.colors.municipalTeal} /> : <ActivityIndicator size="small" color={tokens.colors.municipalTeal} />}
          <Text style={styles.mockNoticeText}>{error || (overview ? 'Live data from the ParkShare database.' : 'Loading live admin data...')}</Text>
        </View>

        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <GlassPanel key={metric.label} style={[styles.metricCard, { width: metricWidth }]} borderRadius={18} intensity={30} overlayColor={tokens.colors.panelSurface}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}18` }]}>
                <Ionicons name={metric.icon} size={20} color={metric.color} />
              </View>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={[styles.metricChange, { color: metric.color }]}>{metric.change} <Text style={styles.metricChangeLabel}>this month</Text></Text>
            </GlassPanel>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Needs your attention</Text>
        <GlassPanel style={styles.panel} borderRadius={20} intensity={30} overlayColor={tokens.colors.panelSurface}>
          {queueItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.queueRow, index < queueItems.length - 1 ? styles.rowDivider : null]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(item.label === 'Unavailable spaces' ? 'AdminSpaces' : 'AdminBookings', { filter: item.label === 'Unavailable spaces' ? 'unavailable' : 'active' })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.label}`}
            >
              <View style={[styles.queueIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.label}</Text>
                <Text style={styles.rowDescription}>{item.description}</Text>
              </View>
              <View style={styles.queueCount}>
                <Text style={styles.queueCountText}>{item.count}</Text>
                <Ionicons name="chevron-forward" size={17} color={tokens.colors.secondaryText} />
              </View>
            </TouchableOpacity>
          ))}
        </GlassPanel>

        <Text style={styles.sectionTitle}>Management areas</Text>
        <View style={styles.managementGrid}>
          {managementAreas.map((item) => (
            <TouchableOpacity key={item.label} style={styles.managementCard} activeOpacity={0.75} onPress={() => navigation.navigate(item.route)} accessibilityRole="button" accessibilityLabel={`Open ${item.label}`}>
              <View style={styles.managementIcon}>
                <Ionicons name={item.icon} size={20} color={tokens.colors.primaryText} />
              </View>
              <Text style={styles.managementLabel}>{item.label}</Text>
              <Text style={styles.managementDescription}>{item.description}</Text>
              <Ionicons name="arrow-forward-outline" size={16} color={tokens.colors.secondaryText} style={styles.managementArrow} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paleMapBackground },
  scrollContent: { padding: 20, paddingBottom: 48, maxWidth: 1080, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, marginBottom: 20 },
  backButton: { alignItems: 'center', backgroundColor: tokens.colors.panelSurface, borderRadius: 12, height: 42, justifyContent: 'center', marginRight: 12, width: 42, ...tokens.shadows.soft },
  headerCopy: { flex: 1 },
  eyebrow: { color: tokens.colors.municipalTeal, fontFamily: tokens.typography.bodySemiBold, fontSize: 10, letterSpacing: 1.1 },
  screenTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 30, marginTop: 3 },
  subtitle: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, marginTop: 3 },
  adminBadge: { alignItems: 'center', backgroundColor: tokens.colors.emeraldTint, borderRadius: tokens.radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 11, paddingVertical: 8 },
  adminBadgeText: { color: tokens.colors.municipalTeal, fontFamily: tokens.typography.bodySemiBold, fontSize: 12 },
  mockNotice: { alignItems: 'center', backgroundColor: '#E8F1F5', borderRadius: 12, flexDirection: 'row', marginBottom: 20, paddingHorizontal: 13, paddingVertical: 11 },
  mockNoticeText: { color: tokens.colors.municipalTeal, flex: 1, fontFamily: tokens.typography.body, fontSize: 12, marginLeft: 8 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  metricCard: { minHeight: 150, padding: 15 },
  metricIcon: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', marginBottom: 13, width: 38 },
  metricLabel: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 12 },
  metricValue: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 22, marginTop: 3 },
  metricChange: { fontFamily: tokens.typography.bodySemiBold, fontSize: 11, marginTop: 7 },
  metricChangeLabel: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 10 },
  sectionTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingMedium, fontSize: 18, marginBottom: 11, marginTop: 25 },
  panel: { paddingHorizontal: 15 },
  queueRow: { alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingVertical: 11 },
  rowDivider: { borderBottomColor: '#E8ECEF', borderBottomWidth: 1 },
  queueIcon: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', marginRight: 11, width: 38 },
  rowCopy: { flex: 1 },
  rowTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodyMedium, fontSize: 13 },
  rowDescription: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 11, marginTop: 3 },
  queueCount: { alignItems: 'center', flexDirection: 'row', gap: 7, marginLeft: 8 },
  queueCountText: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 17 },
  managementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  managementCard: { backgroundColor: tokens.colors.panelSurface, borderColor: tokens.colors.borderLight, borderRadius: 16, borderWidth: 1, minHeight: 126, padding: 14, width: '48%', ...tokens.shadows.soft },
  managementIcon: { alignItems: 'center', backgroundColor: '#F0F3F5', borderRadius: 10, height: 35, justifyContent: 'center', width: 35 },
  managementLabel: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodyMedium, fontSize: 13, marginTop: 12 },
  managementDescription: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 10, marginTop: 3 },
  managementArrow: { bottom: 13, position: 'absolute', right: 13 },
});