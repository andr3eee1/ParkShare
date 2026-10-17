import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../components/GlassPanel';
import { ComposeEmailModal } from '../components/ComposeEmailModal';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { adminApi, ApiRequestError, checkBackendHealth } from '../api/client';
import { API_BASE_URL, API_URL_SOURCE } from '../api/config';
import { styles } from './AdminDashboardScreen.styles';

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

type DiagnosticStatus = 'checking' | 'connected' | 'unavailable' | 'unknown';

type Diagnostics = {
  backend: DiagnosticStatus;
  database: DiagnosticStatus;
  admin: DiagnosticStatus;
  checkedAt: Date | null;
};

const statusLabels: Record<DiagnosticStatus, string> = {
  checking: 'Checking…',
  connected: 'Connected',
  unavailable: 'Unavailable',
  unknown: 'Not verified',
};

const statusIcons: Record<DiagnosticStatus, IconName> = {
  checking: 'ellipsis-horizontal-circle-outline',
  connected: 'checkmark-circle-outline',
  unavailable: 'close-circle-outline',
  unknown: 'help-circle-outline',
};

const statusColors: Record<DiagnosticStatus, string> = {
  checking: tokens.colors.warningAmber,
  connected: tokens.colors.availabilityGreen,
  unavailable: '#C24141',
  unknown: tokens.colors.secondaryText,
};

const formatRequestError = (requestError: unknown): string => {
  if (requestError instanceof ApiRequestError) {
    if (requestError.status === 401) return 'Your session has expired. Sign in again.';
    if (requestError.status === 403) return 'Your account does not have admin access.';
    return requestError.message;
  }
  if (requestError instanceof Error && requestError.name === 'AbortError') {
    return `The backend at ${API_BASE_URL} did not respond in time.`;
  }
  return `Could not reach the backend at ${API_BASE_URL}.`;
};

const DiagnosticRow = ({ label, status, detail }: { label: string; status: DiagnosticStatus; detail?: string }) => (
  <View style={styles.diagnosticRow}>
    <View style={styles.diagnosticCopy}>
      <Text style={styles.diagnosticLabel}>{label}</Text>
      {detail ? <Text style={styles.diagnosticDetail} selectable>{detail}</Text> : null}
    </View>
    <View style={styles.diagnosticStatus}>
      <Ionicons name={statusIcons[status]} size={17} color={statusColors[status]} />
      <Text style={[styles.diagnosticStatusText, { color: statusColors[status] }]}>{statusLabels[status]}</Text>
    </View>
  </View>
);

const managementAreas = [
  { label: 'Users', description: 'Accounts and roles', icon: 'people-outline' as IconName, route: 'AdminUsers' },
  { label: 'Parking spaces', description: 'Listings and approvals', icon: 'map-outline' as IconName, route: 'AdminSpaces' },
  { label: 'Bookings', description: 'Trips and payments', icon: 'receipt-outline' as IconName, route: 'AdminBookings' },
  { label: 'Reports', description: 'Trust and safety', icon: 'flag-outline' as IconName, route: 'AdminReports' },
  { label: 'Sent emails', description: 'Delivery logs & outreach', icon: 'mail-outline' as IconName, route: 'AdminEmails' },
];

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { token, user } = useContext(AuthContext);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({ backend: 'checking', database: 'checking', admin: 'checking', checkedAt: null });
  const [lastStatsRefresh, setLastStatsRefresh] = useState<Date | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showComposeEmailModal, setShowComposeEmailModal] = useState(false);
  const metricWidth = width >= 900 ? '23.5%' : '48%';

  const loadDashboard = useCallback(async () => {
    if (!token) return;

    setError('');
    setDiagnostics((current) => ({ ...current, backend: 'checking', database: 'checking', admin: 'checking' }));

    const [healthResult, overviewResult] = await Promise.allSettled([
      checkBackendHealth(),
      adminApi(token, '/admin/overview'),
    ]);

    const backendStatus: DiagnosticStatus = healthResult.status === 'fulfilled' ? 'connected' : 'unavailable';
    let databaseStatus: DiagnosticStatus = 'unknown';
    if (healthResult.status === 'fulfilled') {
      databaseStatus = healthResult.value.database || 'unknown';
    }

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value);
      setLastStatsRefresh(new Date());
      if (databaseStatus === 'unknown') databaseStatus = 'connected';
    } else {
      setError(formatRequestError(overviewResult.reason));
    }

    setDiagnostics({
      backend: backendStatus,
      database: databaseStatus,
      admin: overviewResult.status === 'fulfilled' ? 'connected' : 'unavailable',
      checkedAt: new Date(),
    });
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainApp', { screen: 'Account' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={21} color={tokens.colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PARKSHARE OPERATIONS</Text>
            <Text style={styles.screenTitle}>Admin dashboard</Text>
            <Text style={styles.subtitle}>Keep the marketplace moving safely.</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={tokens.colors.emeraldDeep} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
            <View style={styles.headerButtonsRow}>
              <TouchableOpacity
                style={styles.sendEmailHeaderBtn}
                onPress={() => setShowComposeEmailModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Send custom email"
              >
                <Ionicons name="mail-outline" size={14} color={tokens.colors.white} />
                <Text style={styles.sendEmailHeaderBtnText}>Send Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.diagnosticsBtn}
                onPress={() => setShowDiagnosticsModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Open connection diagnostics"
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        diagnostics.backend === 'connected' && diagnostics.admin === 'connected'
                          ? tokens.colors.availabilityGreen
                          : diagnostics.backend === 'checking'
                          ? tokens.colors.warningAmber
                          : '#DC2626',
                    },
                  ]}
                />
                <Ionicons name="pulse-outline" size={14} color={tokens.colors.emeraldDeep} />
                <Text style={styles.diagnosticsBtnText}>Diagnostics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {error ? (
          <TouchableOpacity
            style={[styles.mockNotice, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1 }]}
            onPress={() => setShowDiagnosticsModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="warning-outline" size={18} color="#991B1B" />
            <Text style={[styles.mockNoticeText, { color: '#991B1B' }]}>
              {error} — Tap to view diagnostics
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* 4 Primary Metric Squares First */}
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

      {/* Diagnostics Modal Popup */}
      <Modal
        visible={showDiagnosticsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDiagnosticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDiagnosticsModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      width: 10,
                      height: 10,
                      backgroundColor:
                        diagnostics.backend === 'connected' && diagnostics.admin === 'connected'
                          ? tokens.colors.availabilityGreen
                          : '#DC2626',
                    },
                  ]}
                />
                <View>
                  <Text style={styles.modalTitle}>Connection Diagnostics</Text>
                  <Text style={styles.modalSubtitle}>Live platform & database connectivity</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDiagnosticsModal(false)}
                accessibilityLabel="Close diagnostics"
              >
                <Ionicons name="close" size={18} color={tokens.colors.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.diagnosticsPanel}>
              <DiagnosticRow
                label="Backend API"
                status={diagnostics.backend}
                detail={`${API_BASE_URL} · ${API_URL_SOURCE === 'environment' ? 'configured by environment' : 'deployed fallback'}`}
              />
              <DiagnosticRow
                label="Database"
                status={diagnostics.database}
                detail="Verified through the health check and statistics query"
              />
              <DiagnosticRow
                label="Admin access"
                status={diagnostics.admin}
                detail="Authenticated statistics request"
              />
              <DiagnosticRow
                label="Signed-in account"
                status={user ? 'connected' : 'unavailable'}
                detail={user ? `${user.email} · ${user.role}` : 'No authenticated account'}
              />
              <View style={styles.diagnosticFooter}>
                <View style={styles.refreshTimes}>
                  <Text style={styles.checkedAtText}>
                    {diagnostics.checkedAt ? `Checked ${diagnostics.checkedAt.toLocaleTimeString()}` : 'Checking connection…'}
                  </Text>
                  <Text style={styles.checkedAtText}>
                    {lastStatsRefresh ? `Stats refreshed ${lastStatsRefresh.toLocaleTimeString()}` : 'Stats not loaded yet'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadDashboard}
                  disabled={diagnostics.backend === 'checking' || diagnostics.admin === 'checking'}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh connection diagnostics"
                >
                  <Ionicons name="refresh-outline" size={16} color={tokens.colors.emeraldDeep} />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowDiagnosticsModal(false)}
            >
              <Text style={styles.modalDismissBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        visible={showComposeEmailModal}
        onClose={() => setShowComposeEmailModal(false)}
      />
    </SafeAreaView>
  );
};

