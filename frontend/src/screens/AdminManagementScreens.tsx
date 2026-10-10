import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { adminApi, adminPost } from '../api/client';

type IconName = keyof typeof Ionicons.glyphMap;
type AdminRoute = 'AdminUsers' | 'AdminSpaces' | 'AdminBookings' | 'AdminReports';

type Filter = { label: string; value: string };
type AdminRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  statusColor: string;
  icon: IconName;
  searchable: string;
  entityType?: 'USER';
  entityId?: string;
  accountStatus?: string;
};

type PageConfig = {
  title: string;
  subtitle: string;
  icon: IconName;
  accent: string;
  filters: Filter[];
  records: AdminRecord[];
};

const pageConfigs: Record<AdminRoute, PageConfig> = {
  AdminUsers: {
    title: 'Users',
    subtitle: 'Accounts, roles, and verification',
    icon: 'people-outline',
    accent: tokens.colors.municipalTeal,
    filters: [
      { label: 'All users', value: 'all' },
      { label: 'Providers', value: 'provider' },
      { label: 'Admins', value: 'admin' },
    ],
    records: [
      { id: 'u1', title: 'Andrei Popescu', subtitle: 'andrei.popescu@example.com', meta: 'Joined 2 days ago', status: 'Provider', statusColor: '#7C3AED', icon: 'person-outline', searchable: 'andrei popescu example provider' },
      { id: 'u2', title: 'Maria Ionescu', subtitle: 'maria.ionescu@example.com', meta: 'Joined 1 week ago', status: 'User', statusColor: tokens.colors.municipalTeal, icon: 'person-outline', searchable: 'maria ionescu example user' },
      { id: 'u3', title: 'Vlad Dumitrescu', subtitle: 'vlad.dumitrescu@example.com', meta: 'Joined 3 weeks ago', status: 'Provider', statusColor: '#7C3AED', icon: 'person-outline', searchable: 'vlad dumitrescu example provider' },
      { id: 'u4', title: 'Ioana Marin', subtitle: 'ioana.marin@example.com', meta: 'Joined 1 month ago', status: 'Admin', statusColor: tokens.colors.warningAmber, icon: 'shield-checkmark-outline', searchable: 'ioana marin example admin' },
    ],
  },
  AdminSpaces: {
    title: 'Parking spaces',
    subtitle: 'Listings, availability, and approvals',
    icon: 'map-outline',
    accent: tokens.colors.municipalTeal,
    filters: [
      { label: 'All spaces', value: 'all' },
      { label: 'Unavailable', value: 'unavailable' },
      { label: 'Live', value: 'live' },
    ],
    records: [
      { id: 's1', title: 'Calea Victoriei Loft', subtitle: 'Calea Victoriei 118 · 8 RON / hr', meta: 'Submitted 8 min ago', status: 'Needs review', statusColor: tokens.colors.warningAmber, icon: 'business-outline', searchable: 'calea victoriei loft review' },
      { id: 's2', title: 'Piața Romană Residence', subtitle: 'Strada Dacia 22 · 6 RON / hr', meta: 'Approved today', status: 'Live', statusColor: tokens.colors.availabilityGreen, icon: 'business-outline', searchable: 'piata romana residence live' },
      { id: 's3', title: 'Universitate Central Parking', subtitle: 'Bulevardul Regina Elisabeta 5 · 10 RON / hr', meta: 'Approved yesterday', status: 'Live', statusColor: tokens.colors.availabilityGreen, icon: 'business-outline', searchable: 'universitate central parking live' },
      { id: 's4', title: 'Dorobanți Courtyard', subtitle: 'Strada Londra 14 · 7 RON / hr', meta: 'Submitted yesterday', status: 'Needs review', statusColor: tokens.colors.warningAmber, icon: 'business-outline', searchable: 'dorobanti courtyard review' },
    ],
  },
  AdminBookings: {
    title: 'Bookings',
    subtitle: 'Trips, payments, and transaction reviews',
    icon: 'receipt-outline',
    accent: tokens.colors.warningAmber,
    filters: [
      { label: 'All bookings', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Completed', value: 'completed' },
    ],
    records: [
      { id: 'b1', title: 'Booking #PS-1048', subtitle: 'Maria Ionescu · Piața Romană Residence', meta: '42 RON · Today, 09:00–13:00', status: 'Payment review', statusColor: tokens.colors.warningAmber, icon: 'card-outline', searchable: 'ps 1048 maria ionescu piata romana review' },
      { id: 'b2', title: 'Booking #PS-1047', subtitle: 'Andrei Popescu · Calea Victoriei Loft', meta: '24 RON · Today, 08:00–11:00', status: 'Completed', statusColor: tokens.colors.availabilityGreen, icon: 'checkmark-circle-outline', searchable: 'ps 1047 andrei popescu calea victoriei completed' },
      { id: 'b3', title: 'Booking #PS-1046', subtitle: 'Vlad Dumitrescu · Dorobanți Courtyard', meta: '35 RON · Yesterday, 18:00–23:00', status: 'Completed', statusColor: tokens.colors.availabilityGreen, icon: 'checkmark-circle-outline', searchable: 'ps 1046 vlad dumitrescu dorobanti completed' },
      { id: 'b4', title: 'Booking #PS-1045', subtitle: 'Ioana Marin · Universitate Central Parking', meta: '18 RON · Yesterday, 12:00–14:00', status: 'Payment review', statusColor: tokens.colors.warningAmber, icon: 'card-outline', searchable: 'ps 1045 ioana marin universitate review' },
    ],
  },
  AdminReports: {
    title: 'Reports',
    subtitle: 'Trust, safety, and community issues',
    icon: 'flag-outline',
    accent: '#C24141',
    filters: [
      { label: 'All reports', value: 'all' },
      { label: 'Open', value: 'open' },
      { label: 'Resolved', value: 'resolved' },
    ],
    records: [
      { id: 'r1', title: 'Vehicle blocking access', subtitle: 'Universitate Central Parking · Reported by Maria Ionescu', meta: 'Received 18 min ago', status: 'Open', statusColor: '#C24141', icon: 'alert-circle-outline', searchable: 'vehicle blocking access universitate maria open' },
      { id: 'r2', title: 'Listing information mismatch', subtitle: 'Dorobanți Courtyard · Reported by Andrei Popescu', meta: 'Received 46 min ago', status: 'Open', statusColor: '#C24141', icon: 'alert-circle-outline', searchable: 'listing information mismatch dorobanti andrei open' },
      { id: 'r3', title: 'Payment dispute resolved', subtitle: 'Calea Victoriei Loft · Reviewed by support', meta: 'Resolved 2 hrs ago', status: 'Resolved', statusColor: tokens.colors.availabilityGreen, icon: 'checkmark-circle-outline', searchable: 'payment dispute resolved calea victoriei' },
      { id: 'r4', title: 'Damaged gate reported', subtitle: 'Piața Romană Residence · Reported by Vlad Dumitrescu', meta: 'Resolved yesterday', status: 'Resolved', statusColor: tokens.colors.availabilityGreen, icon: 'checkmark-circle-outline', searchable: 'damaged gate piata romana vlad resolved' },
    ],
  },
};

const getConfig = (routeName: string): PageConfig => pageConfigs[routeName as AdminRoute] || pageConfigs.AdminUsers;

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const mapRecords = (routeName: string, data: any): AdminRecord[] => {
  if (routeName === 'AdminUsers') return (data.users || []).map((item: any) => ({
    id: item.id,
    title: `${item.firstName} ${item.lastName}`,
    subtitle: item.email,
    meta: `Joined ${formatDate(item.createdAt)} · ${item._count.ownedSpots} spaces · ${item._count.reservations} bookings · ${item.accountStatus === 'ACTIVE' ? 'Good standing' : item.accountStatus}`,
    status: item.role.charAt(0) + item.role.slice(1).toLowerCase(),
    statusColor: item.role === 'ADMIN' ? tokens.colors.warningAmber : item.role === 'PROVIDER' ? '#7C3AED' : tokens.colors.municipalTeal,
    icon: item.role === 'ADMIN' ? 'shield-checkmark-outline' : 'person-outline',
    searchable: `${item.firstName} ${item.lastName} ${item.email} ${item.role} ${item.accountStatus}`.toLowerCase(),
    entityType: 'USER',
    entityId: item.id,
    accountStatus: item.accountStatus,
  }));
  if (routeName === 'AdminSpaces') return (data.spaces || []).map((item: any) => ({
    id: item.id,
    title: item.name,
    subtitle: `${item.price} RON / hr · ${item.owner.firstName} ${item.owner.lastName}`,
    meta: `${item._count.reservations} reservations · Added ${formatDate(item.createdAt)}`,
    status: item.isAvailable ? 'Live' : 'Unavailable',
    statusColor: item.isAvailable ? tokens.colors.availabilityGreen : tokens.colors.warningAmber,
    icon: 'business-outline',
    searchable: `${item.name} ${item.owner.email} ${item.owner.firstName} ${item.owner.lastName} ${item.isAvailable ? 'live' : 'unavailable'}`.toLowerCase(),
  }));
  if (routeName === 'AdminReports') return (data.reports || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    subtitle: `Reported by ${item.reporterName}`,
    meta: `Created ${formatDate(item.createdAt)}`,
    status: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
    statusColor: item.status === 'OPEN' ? '#C24141' : item.status === 'RESOLVED' ? tokens.colors.availabilityGreen : tokens.colors.secondaryText,
    icon: 'alert-circle-outline',
    searchable: `${item.title} ${item.description} ${item.reporterName} ${item.status}`.toLowerCase(),
  }));
  return (data.bookings || []).map((item: any) => ({
    id: item.id,
    title: `Booking ${item.id.slice(0, 8)}`,
    subtitle: `${item.user.firstName} ${item.user.lastName} · ${item.spot.name}`,
    meta: `${item.totalPrice} RON · ${formatDate(item.startTime)}`,
    status: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
    statusColor: item.status === 'COMPLETED' ? tokens.colors.availabilityGreen : item.status === 'CANCELLED' ? '#C24141' : tokens.colors.warningAmber,
    icon: item.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'card-outline',
    searchable: `${item.id} ${item.user.email} ${item.user.firstName} ${item.user.lastName} ${item.spot.name} ${item.status}`.toLowerCase(),
  }));
};

export const AdminManagementScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const config = getConfig(route.name);
  const { token } = useContext(AuthContext);
  const [filter, setFilter] = useState(route.params?.filter || 'all');
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const endpoint = route.name === 'AdminUsers' ? '/admin/users' : route.name === 'AdminSpaces' ? '/admin/spaces' : route.name === 'AdminBookings' ? '/admin/bookings' : '/admin/reports';
    setLoading(true);
    adminApi(token, endpoint)
      .then((data) => {
        if (route.name === 'AdminReports' && data.available === false) setError(data.reason);
        setRecords(mapRecords(route.name, data));
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [route.name, token]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      const filterLabel = config.filters.find((item) => item.value === filter)?.label.toLowerCase().replace(/s$/, '');
      const matchesFilter = filter === 'all' || record.status.toLowerCase() === filterLabel;
      const matchesQuery = !normalizedQuery || record.searchable.includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [config, filter, query, records]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color={tokens.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: `${config.accent}18` }]}>
              <Ionicons name={config.icon} size={20} color={config.accent} />
            </View>
            <Text style={styles.title}>{config.title}</Text>
          </View>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${config.title.toLowerCase()}...`}
        placeholderTextColor={tokens.colors.secondaryText}
        style={styles.searchInput}
        accessibilityLabel={`Search ${config.title}`}
      />

      <View style={styles.filters}>
        {config.filters.map((item) => (
          <TouchableOpacity key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, filter === item.value ? { backgroundColor: config.accent } : null]} activeOpacity={0.8}>
            <Text style={[styles.filterText, filter === item.value ? styles.activeFilterText : null]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visibleRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.resultCount}>{visibleRecords.length} {visibleRecords.length === 1 ? 'result' : 'results'}</Text>}
        ListEmptyComponent={<View style={styles.emptyState}>{loading ? <ActivityIndicator color={config.accent} /> : <Ionicons name="search-outline" size={38} color="#B7C0C6" />}<Text style={styles.emptyTitle}>{loading ? 'Loading records...' : error || 'Nothing found'}</Text><Text style={styles.emptyText}>{loading ? 'Reading from the database.' : error ? 'This section is not available in the current database.' : 'Try another search or filter.'}</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recordCard} activeOpacity={0.8} onPress={() => navigation.navigate('AdminRecord', { title: item.title, subtitle: item.subtitle, meta: item.meta, status: item.status, statusColor: item.statusColor, icon: item.icon, entityType: item.entityType, entityId: item.entityId, accountStatus: item.accountStatus })}>
            <View style={[styles.recordIcon, { backgroundColor: `${item.statusColor}18` }]}>
              <Ionicons name={item.icon} size={20} color={item.statusColor} />
            </View>
            <View style={styles.recordCopy}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordSubtitle}>{item.subtitle}</Text>
              <Text style={styles.recordMeta}>{item.meta}</Text>
            </View>
            <View style={styles.recordRight}>
              <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
              <Ionicons name="chevron-forward" size={17} color={tokens.colors.secondaryText} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export const AdminRecordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const record = route.params || {};
  const { token } = useContext(AuthContext);
  const { alert } = useAlert();
  const isUser = record.entityType === 'USER' && !!record.entityId;

  const [standing, setStanding] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loadingStanding, setLoadingStanding] = useState(!!isUser);
  const [pendingAction, setPendingAction] = useState<null | 'WARN' | 'SUSPEND' | 'BAN' | 'REINSTATE'>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStanding = async () => {
    if (!isUser || !token) return;
    try {
      const data = await adminApi(token, `/admin/users/${record.entityId}/standing`);
      setStanding(data.standing);
      setActions(data.actions || []);
    } catch (error: any) {
      console.warn('Failed to load standing', error?.message);
    } finally {
      setLoadingStanding(false);
    }
  };

  useEffect(() => {
    loadStanding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.entityId, token]);

  const confirmSanction = async () => {
    if (!pendingAction || !token) return;
    setSubmitting(true);
    try {
      await adminPost(token, `/admin/users/${record.entityId}/sanction`, {
        action: pendingAction,
        reason: reason.trim() || undefined,
        durationDays: pendingAction === 'SUSPEND' ? 14 : undefined,
      });
      const applied = pendingAction;
      setPendingAction(null);
      setReason('');
      alert('Done', `Action ${applied} applied to this user.`, undefined, 'success');
      await loadStanding();
    } catch (error: any) {
      alert('Error', error?.message || 'Could not apply action', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const standingColor = (value?: string) =>
    value === 'ACTIVE' ? tokens.colors.availabilityGreen
      : value === 'WARNING' ? tokens.colors.warningAmber
        : value === 'SUSPENDED' ? '#D97706'
          : '#C24141';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color={tokens.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>Record details</Text><Text style={styles.subtitle}>{isUser ? 'User standing & moderation' : 'Database record'}</Text></View>
      </View>
      <View style={styles.detailContent}>
        <View style={styles.detailIcon}><Ionicons name={record.icon || 'document-text-outline'} size={28} color={record.statusColor || tokens.colors.municipalTeal} /></View>
        <Text style={styles.detailTitle}>{record.title}</Text>
        <Text style={styles.detailSubtitle}>{record.subtitle}</Text>
        <View style={styles.detailPanel}>
          <Text style={styles.detailLabel}>Account status</Text>
          <Text style={[styles.detailValue, { color: standingColor(standing?.status || record.accountStatus) }]}>
            {standing?.status || record.accountStatus || record.status}
          </Text>
          <Text style={styles.detailLabel}>Activity</Text>
          <Text style={styles.detailValue}>{record.meta}</Text>
        </View>

        {isUser && (
          loadingStanding ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={tokens.colors.municipalTeal} />
          ) : standing ? (
            <>
              <View style={styles.standingScores}>
                <View style={styles.standingScore}>
                  <Text style={styles.standingScoreValue}>{standing.driverScore?.toFixed(2)}</Text>
                  <Text style={styles.standingScoreLabel}>Driver ({standing.driverReviews})</Text>
                </View>
                <View style={styles.standingScore}>
                  <Text style={styles.standingScoreValue}>{standing.hostScore?.toFixed(2)}</Text>
                  <Text style={styles.standingScoreLabel}>Host ({standing.hostReviews})</Text>
                </View>
                <View style={styles.standingScore}>
                  <Text style={styles.standingScoreValue}>{standing.warningCount ?? 0}</Text>
                  <Text style={styles.standingScoreLabel}>Warnings</Text>
                </View>
              </View>

              <Text style={styles.detailLabel}>Manual action</Text>
              <View style={styles.sanctionRow}>
                {(['WARN', 'SUSPEND', 'BAN', 'REINSTATE'] as const).map((action) => {
                  const color = action === 'WARN' ? tokens.colors.warningAmber
                    : action === 'SUSPEND' ? '#D97706'
                      : action === 'BAN' ? '#C24141'
                        : tokens.colors.availabilityGreen;
                  return (
                    <TouchableOpacity key={action} style={[styles.sanctionButton, { borderColor: color }]} onPress={() => { setReason(''); setPendingAction(action); }}>
                      <Text style={[styles.sanctionButtonText, { color }]}>{action.charAt(0) + action.slice(1).toLowerCase()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {actions.length > 0 && (
                <View style={styles.auditPanel}>
                  <Text style={styles.detailLabel}>History</Text>
                  {actions.slice(0, 6).map((a: any) => (
                    <Text key={a.id} style={styles.auditRow}>
                      {a.action.replace('AUTO_', 'Auto ')} · {new Date(a.createdAt).toLocaleDateString()}{a.actor ? ` · by ${a.actor.firstName}` : ''}
                    </Text>
                  ))}
                </View>
              )}
            </>
          ) : null
        )}

        {!isUser && (
          <View style={styles.mockNotice}>
            <Ionicons name="information-circle-outline" size={18} color={tokens.colors.municipalTeal} />
            <Text style={styles.mockNoticeText}>Read-only details loaded from the admin API.</Text>
          </View>
        )}
      </View>

      <Modal visible={!!pendingAction} transparent animationType="fade" onRequestClose={() => setPendingAction(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setPendingAction(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Confirm {pendingAction?.toLowerCase()}</Text>
            <Text style={styles.modalText}>
              {pendingAction === 'BAN'
                ? 'This permanently bans the user. They will be able to appeal.'
                : pendingAction === 'REINSTATE'
                  ? 'This restores the account to good standing.'
                  : pendingAction === 'SUSPEND'
                    ? 'This suspends new bookings for 14 days.'
                    : 'This records a warning and notifies the user.'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional, shown to the user)"
              placeholderTextColor={tokens.colors.secondaryText}
              multiline
              editable={!submitting}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setPendingAction(null)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={confirmSanction} disabled={submitting}>
                {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.modalConfirmText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paleMapBackground },
  header: { alignItems: 'flex-start', flexDirection: 'row', padding: 20, paddingBottom: 12 },
  backButton: { alignItems: 'center', backgroundColor: tokens.colors.panelSurface, borderRadius: 12, height: 42, justifyContent: 'center', marginRight: 12, width: 42, ...tokens.shadows.soft },
  headerCopy: { flex: 1 },
  titleRow: { alignItems: 'center', flexDirection: 'row' },
  titleIcon: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', marginRight: 10, width: 38 },
  title: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 28 },
  subtitle: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 12, marginTop: 4 },
  searchInput: { backgroundColor: tokens.colors.panelSurface, borderColor: tokens.colors.borderLight, borderRadius: 13, borderWidth: 1, color: tokens.colors.primaryText, fontFamily: tokens.typography.body, fontSize: 13, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 12 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  filter: { backgroundColor: tokens.colors.panelSurface, borderRadius: tokens.radii.pill, paddingHorizontal: 13, paddingVertical: 9 },
  filterText: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.bodyMedium, fontSize: 11 },
  activeFilterText: { color: tokens.colors.white },
  listContent: { paddingBottom: 36, paddingHorizontal: 20 },
  resultCount: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.bodySemiBold, fontSize: 11, marginBottom: 9 },
  recordCard: { alignItems: 'center', backgroundColor: tokens.colors.panelSurface, borderColor: tokens.colors.borderLight, borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginBottom: 10, minHeight: 92, padding: 13, ...tokens.shadows.soft },
  recordIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', marginRight: 11, width: 42 },
  recordCopy: { flex: 1 },
  recordTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodyMedium, fontSize: 14 },
  recordSubtitle: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 11, marginTop: 3 },
  recordMeta: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 10, marginTop: 5 },
  recordRight: { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  statusText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 10, textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingTop: 70 },
  emptyTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingMedium, fontSize: 17, marginTop: 12 },
  emptyText: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 12, marginTop: 4 },
  detailContent: { padding: 20 },
  detailIcon: { alignItems: 'center', backgroundColor: '#E8F1F5', borderRadius: 18, height: 64, justifyContent: 'center', width: 64 },
  detailTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 27, marginTop: 18 },
  detailSubtitle: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, lineHeight: 20, marginTop: 5 },
  detailPanel: { backgroundColor: tokens.colors.panelSurface, borderRadius: 16, marginTop: 24, padding: 17, ...tokens.shadows.soft },
  detailLabel: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.bodySemiBold, fontSize: 11, marginTop: 9 },
  detailValue: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodyMedium, fontSize: 14, marginTop: 3 },
  mockNotice: { alignItems: 'center', backgroundColor: '#E8F1F5', borderRadius: 12, flexDirection: 'row', marginTop: 16, paddingHorizontal: 13, paddingVertical: 11 },
  mockNoticeText: { color: tokens.colors.municipalTeal, flex: 1, fontFamily: tokens.typography.body, fontSize: 12, marginLeft: 8 },
  standingScores: { flexDirection: 'row', gap: 10, marginTop: 18 },
  standingScore: { alignItems: 'center', backgroundColor: tokens.colors.panelSurface, borderRadius: 14, flex: 1, paddingVertical: 14, ...tokens.shadows.soft },
  standingScoreValue: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 20 },
  standingScoreLabel: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 10, marginTop: 3 },
  sanctionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sanctionButton: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 9 },
  sanctionButtonText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 12 },
  auditPanel: { backgroundColor: tokens.colors.panelSurface, borderRadius: 14, marginTop: 18, padding: 14, ...tokens.shadows.soft },
  auditRow: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 12, marginTop: 6 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: tokens.colors.white, borderRadius: 18, maxWidth: 420, padding: 22, width: '100%' },
  modalTitle: { color: tokens.colors.primaryText, fontFamily: tokens.typography.headingBold, fontSize: 19 },
  modalText: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, lineHeight: 19, marginTop: 8 },
  modalInput: { borderColor: '#E5E7EB', borderRadius: 12, borderWidth: 1, color: tokens.colors.primaryText, fontFamily: tokens.typography.body, fontSize: 14, marginTop: 14, minHeight: 72, padding: 12, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalButton: { alignItems: 'center', borderRadius: 12, flex: 1, paddingVertical: 13 },
  modalCancel: { backgroundColor: '#EEF2F5' },
  modalCancelText: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodySemiBold, fontSize: 14 },
  modalConfirm: { backgroundColor: tokens.colors.primaryText },
  modalConfirmText: { color: tokens.colors.white, fontFamily: tokens.typography.bodySemiBold, fontSize: 14 },
});