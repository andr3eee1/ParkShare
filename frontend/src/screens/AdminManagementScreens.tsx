import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { adminApi, adminPost, adminPatch, adminDelete } from '../api/client';
import { ComposeEmailModal } from '../components/ComposeEmailModal';
import { styles } from './AdminManagementScreens.styles';

type IconName = keyof typeof Ionicons.glyphMap;
type AdminRoute = 'AdminUsers' | 'AdminSpaces' | 'AdminBookings' | 'AdminReports' | 'AdminEmails';

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
  entityType?: 'USER' | 'SPACE' | 'BOOKING' | 'REPORT' | 'EMAIL';
  entityId?: string;
  accountStatus?: string;
  rawData?: any;
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
    accent: tokens.colors.emerald,
    filters: [
      { label: 'All users', value: 'all' },
      { label: 'Providers', value: 'provider' },
      { label: 'Admins', value: 'admin' },
    ],
    records: [],
  },
  AdminSpaces: {
    title: 'Parking spaces',
    subtitle: 'Listings, availability, and approvals',
    icon: 'map-outline',
    accent: tokens.colors.emerald,
    filters: [
      { label: 'All spaces', value: 'all' },
      { label: 'Unavailable', value: 'unavailable' },
      { label: 'Live', value: 'live' },
    ],
    records: [],
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
      { label: 'Cancelled', value: 'cancelled' },
    ],
    records: [],
  },
  AdminReports: {
    title: 'Reports',
    subtitle: 'Trust, safety, and community issues',
    icon: 'flag-outline',
    accent: tokens.colors.danger,
    filters: [
      { label: 'All reports', value: 'all' },
      { label: 'Open', value: 'open' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Dismissed', value: 'dismissed' },
    ],
    records: [],
  },
  AdminEmails: {
    title: 'Sent emails',
    subtitle: 'Outreach history & delivery audit logs',
    icon: 'mail-outline',
    accent: tokens.colors.emerald,
    filters: [
      { label: 'All emails', value: 'all' },
      { label: 'Sent', value: 'sent' },
      { label: 'Failed', value: 'failed' },
    ],
    records: [],
  },
};

const getConfig = (routeName: string): PageConfig =>
  pageConfigs[routeName as AdminRoute] || pageConfigs.AdminUsers;

const formatDate = (value: string | Date) => new Date(value).toLocaleDateString();

const mapRecords = (routeName: string, data: any): AdminRecord[] => {
  if (routeName === 'AdminUsers') {
    return (data.users || []).map((item: any) => ({
      id: item.id,
      title: `${item.firstName} ${item.lastName}`,
      subtitle: item.email,
      meta: `Joined ${formatDate(item.createdAt)} · ${item._count?.ownedSpots || 0} spaces · ${item._count?.reservations || 0} bookings · ${item.accountStatus === 'ACTIVE' ? 'Good standing' : item.accountStatus}`,
      status: item.role.charAt(0) + item.role.slice(1).toLowerCase(),
      statusColor:
        item.role === 'ADMIN'
          ? tokens.colors.warningAmber
          : item.role === 'PROVIDER'
          ? '#7C3AED'
          : tokens.colors.emerald,
      icon: item.role === 'ADMIN' ? 'shield-checkmark-outline' : 'person-outline',
      searchable: `${item.firstName} ${item.lastName} ${item.email} ${item.role} ${item.accountStatus}`.toLowerCase(),
      entityType: 'USER',
      entityId: item.id,
      accountStatus: item.accountStatus,
      rawData: item,
    }));
  }

  if (routeName === 'AdminSpaces') {
    return (data.spaces || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.price} RON / hr · ${item.owner?.firstName || 'Host'} ${item.owner?.lastName || ''}`,
      meta: `${item._count?.reservations || 0} reservations · Added ${formatDate(item.createdAt)}`,
      status: item.isAvailable ? 'Live' : 'Unavailable',
      statusColor: item.isAvailable ? tokens.colors.availabilityGreen : tokens.colors.warningAmber,
      icon: 'business-outline',
      searchable: `${item.name} ${item.owner?.email || ''} ${item.owner?.firstName || ''} ${item.owner?.lastName || ''} ${item.isAvailable ? 'live' : 'unavailable'}`.toLowerCase(),
      entityType: 'SPACE',
      entityId: item.id,
      rawData: item,
    }));
  }

  if (routeName === 'AdminReports') {
    return (data.reports || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: `Reported by ${item.reporterName}`,
      meta: `Created ${formatDate(item.createdAt)}`,
      status: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
      statusColor:
        item.status === 'OPEN'
          ? tokens.colors.danger
          : item.status === 'RESOLVED'
          ? tokens.colors.availabilityGreen
          : tokens.colors.secondaryText,
      icon: 'alert-circle-outline',
      searchable: `${item.title} ${item.description} ${item.reporterName} ${item.status}`.toLowerCase(),
      entityType: 'REPORT',
      entityId: item.id,
      rawData: item,
    }));
  }

  if (routeName === 'AdminEmails') {
    return (data.emails || []).map((item: any) => ({
      id: item.id,
      title: item.subject,
      subtitle: `To: ${item.to}${item.user ? ` (${item.user.firstName} ${item.user.lastName})` : ''}`,
      meta: `Sent ${new Date(item.createdAt).toLocaleString()} · ${item.sender || 'System'}${item.error ? ` · Error: ${item.error}` : ''}`,
      status: item.status === 'SENT' ? 'Sent' : 'Failed',
      statusColor: item.status === 'SENT' ? tokens.colors.availabilityGreen : tokens.colors.danger,
      icon: item.status === 'SENT' ? 'mail-outline' : 'alert-circle-outline',
      searchable: `${item.subject} ${item.to} ${item.status} ${item.bodyPreview || ''}`.toLowerCase(),
      entityType: 'EMAIL',
      entityId: item.id,
      rawData: item,
    }));
  }

  return (data.bookings || []).map((item: any) => ({
    id: item.id,
    title: `Booking #${item.id.slice(0, 8)}`,
    subtitle: `${item.user?.firstName || 'Driver'} ${item.user?.lastName || ''} · ${item.spot?.name || 'Spot'}`,
    meta: `${item.totalPrice} RON · ${formatDate(item.startTime)}`,
    status: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
    statusColor:
      item.status === 'COMPLETED'
        ? tokens.colors.availabilityGreen
        : item.status === 'CANCELLED'
        ? tokens.colors.danger
        : tokens.colors.warningAmber,
    icon: item.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'card-outline',
    searchable: `${item.id} ${item.user?.email || ''} ${item.user?.firstName || ''} ${item.user?.lastName || ''} ${item.spot?.name || ''} ${item.status}`.toLowerCase(),
    entityType: 'BOOKING',
    entityId: item.id,
    rawData: item,
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
  const [showComposeEmail, setShowComposeEmail] = useState(false);

  const loadData = useCallback(() => {
    if (!token) return;
    const endpoint =
      route.name === 'AdminUsers'
        ? '/admin/users'
        : route.name === 'AdminSpaces'
        ? '/admin/spaces'
        : route.name === 'AdminBookings'
        ? '/admin/bookings'
        : route.name === 'AdminReports'
        ? '/admin/reports'
        : '/admin/emails';

    setLoading(true);
    adminApi(token, endpoint)
      .then((data) => {
        if (route.name === 'AdminReports' && data.available === false) setError(data.reason);
        setRecords(mapRecords(route.name, data));
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [route.name, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

        {(route.name === 'AdminEmails' || route.name === 'AdminUsers') && (
          <TouchableOpacity
            style={styles.headerComposeBtn}
            onPress={() => setShowComposeEmail(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Compose custom email"
          >
            <Ionicons name="mail-outline" size={15} color={tokens.colors.white} />
            <Text style={styles.headerComposeBtnText}>Compose</Text>
          </TouchableOpacity>
        )}
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
          <TouchableOpacity
            key={item.value}
            onPress={() => setFilter(item.value)}
            style={[styles.filter, filter === item.value ? { backgroundColor: config.accent } : null]}
            activeOpacity={0.8}
          >
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? <ActivityIndicator color={config.accent} /> : <Ionicons name="search-outline" size={38} color="#B7C0C6" />}
            <Text style={styles.emptyTitle}>{loading ? 'Loading records...' : error || 'Nothing found'}</Text>
            <Text style={styles.emptyText}>{loading ? 'Reading from the database.' : error ? 'This section is not available.' : 'Try another search or filter.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recordCard}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('AdminRecord', {
                title: item.title,
                subtitle: item.subtitle,
                meta: item.meta,
                status: item.status,
                statusColor: item.statusColor,
                icon: item.icon,
                entityType: item.entityType,
                entityId: item.entityId,
                accountStatus: item.accountStatus,
                rawData: item.rawData,
              })
            }
          >
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

      <ComposeEmailModal
        visible={showComposeEmail}
        onClose={() => setShowComposeEmail(false)}
        onSuccess={loadData}
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
  const isSpace = record.entityType === 'SPACE' && !!record.entityId;
  const isBooking = record.entityType === 'BOOKING' && !!record.entityId;
  const isReport = record.entityType === 'REPORT' && !!record.entityId;
  const isEmail = record.entityType === 'EMAIL' && !!record.entityId;

  // Local live state
  const [localTitle, setLocalTitle] = useState(record.title || '');
  const [localSubtitle, setLocalSubtitle] = useState(record.subtitle || '');
  const [localStatus, setLocalStatus] = useState(record.status || '');
  const [localStatusColor, setLocalStatusColor] = useState(record.statusColor || tokens.colors.emerald);

  // User moderation state
  const [standing, setStanding] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loadingStanding, setLoadingStanding] = useState(!!isUser);
  const [pendingAction, setPendingAction] = useState<null | 'WARN' | 'SUSPEND' | 'BAN' | 'REINSTATE'>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Email modal
  const [showComposeEmail, setShowComposeEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(
    isUser ? record.rawData?.email || record.subtitle : isBooking ? record.rawData?.user?.email || '' : isEmail ? record.rawData?.to || '' : ''
  );

  // Edit Modals
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(record.rawData?.firstName || '');
  const [editLastName, setEditLastName] = useState(record.rawData?.lastName || '');
  const [editRole, setEditRole] = useState<'USER' | 'PROVIDER' | 'ADMIN'>(record.rawData?.role || 'USER');
  const [editWallet, setEditWallet] = useState(String(record.rawData?.walletBalance ?? 0));
  const [editEmailVerified, setEditEmailVerified] = useState(Boolean(record.rawData?.emailVerified));

  const [showEditSpaceModal, setShowEditSpaceModal] = useState(false);
  const [editSpaceName, setEditSpaceName] = useState(record.rawData?.name || record.title || '');
  const [editSpacePrice, setEditSpacePrice] = useState(String(record.rawData?.price ?? ''));
  const [editSpaceDesc, setEditSpaceDesc] = useState(record.rawData?.description || '');
  const [spaceAvailable, setSpaceAvailable] = useState(Boolean(record.rawData?.isAvailable ?? (record.status === 'Live')));

  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [editBookingPrice, setEditBookingPrice] = useState(String(record.rawData?.totalPrice ?? ''));
  const [editBookingDeposit, setEditBookingDeposit] = useState(String(record.rawData?.securityDeposit ?? '50'));

  const loadStanding = useCallback(async () => {
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
  }, [isUser, record.entityId, token]);

  useEffect(() => {
    loadStanding();
  }, [loadStanding]);

  // User Actions
  const handleSaveUser = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const updated = await adminPatch(token, `/admin/users/${record.entityId}`, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        role: editRole,
        walletBalance: parseFloat(editWallet) || 0,
        emailVerified: editEmailVerified,
      });

      setLocalTitle(`${updated.user.firstName} ${updated.user.lastName}`);
      setLocalStatus(updated.user.role.charAt(0) + updated.user.role.slice(1).toLowerCase());
      setShowEditUserModal(false);
      alert('Updated', 'User profile and role updated successfully.', undefined, 'success');
      await loadStanding();
    } catch (err: any) {
      alert('Error', err?.message || 'Could not update user.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  // Space Actions
  const handleToggleSpaceAvailability = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const nextState = !spaceAvailable;
      await adminPatch(token, `/admin/spaces/${record.entityId}`, {
        isAvailable: nextState,
      });
      setSpaceAvailable(nextState);
      setLocalStatus(nextState ? 'Live' : 'Unavailable');
      setLocalStatusColor(nextState ? tokens.colors.availabilityGreen : tokens.colors.warningAmber);
      alert('Status Changed', nextState ? 'Space is now Live on the marketplace.' : 'Space marked as Unavailable.', undefined, 'success');
    } catch (err: any) {
      alert('Error', err?.message || 'Could not change space availability.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSpace = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const updated = await adminPatch(token, `/admin/spaces/${record.entityId}`, {
        name: editSpaceName.trim(),
        price: parseFloat(editSpacePrice) || 0,
        description: editSpaceDesc.trim() || undefined,
      });
      setLocalTitle(updated.space.name);
      setLocalSubtitle(`${updated.space.price} RON / hr · ${updated.space.owner?.firstName || 'Host'} ${updated.space.owner?.lastName || ''}`);
      setShowEditSpaceModal(false);
      alert('Updated', 'Parking space details updated successfully.', undefined, 'success');
    } catch (err: any) {
      alert('Error', err?.message || 'Could not update parking space.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await adminDelete(token, `/admin/spaces/${record.entityId}`);
      alert('Deleted', 'Parking space removed successfully.', undefined, 'success');
      navigation.goBack();
    } catch (err: any) {
      alert('Cannot Delete', err?.message || 'Could not delete parking space.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Booking Actions
  const handleUpdateBookingStatus = async (status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
    if (!token) return;
    setSubmitting(true);
    try {
      await adminPatch(token, `/admin/bookings/${record.entityId}`, { status });
      setLocalStatus(status.charAt(0) + status.slice(1).toLowerCase());
      setLocalStatusColor(
        status === 'COMPLETED'
          ? tokens.colors.availabilityGreen
          : status === 'CANCELLED'
          ? tokens.colors.danger
          : tokens.colors.warningAmber
      );
      alert('Booking Updated', `Status changed to ${status}.`, undefined, 'success');
    } catch (err: any) {
      alert('Error', err?.message || 'Could not update booking status.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBookingPricing = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const updated = await adminPatch(token, `/admin/bookings/${record.entityId}`, {
        totalPrice: parseFloat(editBookingPrice) || 0,
        securityDeposit: parseFloat(editBookingDeposit) || 0,
      });
      setShowEditBookingModal(false);
      alert('Pricing Updated', `Total price: ${updated.booking.totalPrice} RON, Deposit: ${updated.booking.securityDeposit} RON.`, undefined, 'success');
    } catch (err: any) {
      alert('Error', err?.message || 'Could not update booking pricing.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Report Actions
  const handleUpdateReportStatus = async (status: 'OPEN' | 'RESOLVED' | 'DISMISSED') => {
    if (!token) return;
    setSubmitting(true);
    try {
      await adminPatch(token, `/admin/reports/${record.entityId}`, { status });
      setLocalStatus(status.charAt(0) + status.slice(1).toLowerCase());
      setLocalStatusColor(
        status === 'RESOLVED'
          ? tokens.colors.availabilityGreen
          : status === 'OPEN'
          ? tokens.colors.danger
          : tokens.colors.secondaryText
      );
      alert('Report Updated', `Status set to ${status}.`, undefined, 'success');
    } catch (err: any) {
      alert('Error', err?.message || 'Could not update report status.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const standingColor = (value?: string) =>
    value === 'ACTIVE'
      ? tokens.colors.availabilityGreen
      : value === 'WARNING' || value === 'SUSPENDED'
      ? tokens.colors.warningAmber
      : tokens.colors.danger;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color={tokens.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Record details</Text>
          <Text style={styles.subtitle}>
            {isUser
              ? 'User profile & moderation'
              : isSpace
              ? 'Parking space listing'
              : isBooking
              ? 'Booking & payments'
              : isReport
              ? 'Community report'
              : isEmail
              ? 'Sent communication'
              : 'Database record'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailIcon}>
          <Ionicons name={record.icon || 'document-text-outline'} size={28} color={localStatusColor} />
        </View>
        <Text style={styles.detailTitle}>{localTitle}</Text>
        <Text style={styles.detailSubtitle}>{localSubtitle}</Text>

        {/* Status & Activity Panel */}
        <View style={styles.detailPanel}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={[styles.detailValue, { color: localStatusColor }]}>
            {localStatus || record.status}
          </Text>
          <Text style={styles.detailLabel}>Details</Text>
          <Text style={styles.detailValue}>{record.meta}</Text>
        </View>

        {/* ── USER MANAGEMENT & EDITING ── */}
        {isUser && (
          <>
            <Text style={styles.detailLabel}>Admin actions</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setShowEditUserModal(true)}
              >
                <Ionicons name="create-outline" size={16} color={tokens.colors.white} />
                <Text style={styles.primaryActionText}>Edit User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => {
                  setEmailRecipient(record.rawData?.email || record.subtitle);
                  setShowComposeEmail(true);
                }}
              >
                <Ionicons name="mail-outline" size={16} color={tokens.colors.emeraldDeep} />
                <Text style={styles.secondaryActionText}>Send Email</Text>
              </TouchableOpacity>
            </View>

            {loadingStanding ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={tokens.colors.emerald} />
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

                <Text style={styles.detailLabel}>Trust & Safety sanction</Text>
                <View style={styles.sanctionRow}>
                  {(['WARN', 'SUSPEND', 'BAN', 'REINSTATE'] as const).map((action) => {
                    const color =
                      action === 'WARN' || action === 'SUSPEND'
                        ? tokens.colors.warningAmber
                        : action === 'BAN'
                        ? tokens.colors.danger
                        : tokens.colors.availabilityGreen;
                    return (
                      <TouchableOpacity
                        key={action}
                        style={[styles.sanctionButton, { borderColor: color }]}
                        onPress={() => {
                          setReason('');
                          setPendingAction(action);
                        }}
                      >
                        <Text style={[styles.sanctionButtonText, { color }]}>
                          {action.charAt(0) + action.slice(1).toLowerCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {actions.length > 0 && (
                  <View style={styles.auditPanel}>
                    <Text style={styles.detailLabel}>Standing History</Text>
                    {actions.slice(0, 6).map((a: any) => (
                      <Text key={a.id} style={styles.auditRow}>
                        {a.action.replace('AUTO_', 'Auto ')} · {new Date(a.createdAt).toLocaleDateString()}{a.actor ? ` · by ${a.actor.firstName}` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </>
        )}

        {/* ── PARKING SPACE MANAGEMENT & EDITING ── */}
        {isSpace && (
          <>
            <Text style={styles.detailLabel}>Listing Controls</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={spaceAvailable ? styles.secondaryActionButton : styles.primaryActionButton}
                onPress={handleToggleSpaceAvailability}
                disabled={submitting}
              >
                <Ionicons
                  name={spaceAvailable ? 'pause-circle-outline' : 'checkmark-circle-outline'}
                  size={16}
                  color={spaceAvailable ? tokens.colors.emeraldDeep : tokens.colors.white}
                />
                <Text style={spaceAvailable ? styles.secondaryActionText : styles.primaryActionText}>
                  {spaceAvailable ? 'Set as Unavailable' : 'Make Live'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setShowEditSpaceModal(true)}
              >
                <Ionicons name="pencil-outline" size={16} color={tokens.colors.white} />
                <Text style={styles.primaryActionText}>Edit Space</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerActionButton}
                onPress={handleDeleteSpace}
                disabled={submitting}
              >
                <Ionicons name="trash-outline" size={16} color={tokens.colors.danger} />
                <Text style={styles.dangerActionText}>Delete Space</Text>
              </TouchableOpacity>
            </View>

            {record.rawData?.description ? (
              <View style={styles.auditPanel}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.auditRow}>{record.rawData.description}</Text>
              </View>
            ) : null}
          </>
        )}

        {/* ── BOOKING MANAGEMENT & EDITING ── */}
        {isBooking && (
          <>
            <Text style={styles.detailLabel}>Booking status actions</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => handleUpdateBookingStatus('COMPLETED')}
                disabled={submitting}
              >
                <Ionicons name="checkmark-done-outline" size={16} color={tokens.colors.white} />
                <Text style={styles.primaryActionText}>Mark Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => handleUpdateBookingStatus('ACTIVE')}
                disabled={submitting}
              >
                <Ionicons name="play-outline" size={16} color={tokens.colors.emeraldDeep} />
                <Text style={styles.secondaryActionText}>Set Active</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerActionButton}
                onPress={() => handleUpdateBookingStatus('CANCELLED')}
                disabled={submitting}
              >
                <Ionicons name="close-circle-outline" size={16} color={tokens.colors.danger} />
                <Text style={styles.dangerActionText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionButtonsRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => setShowEditBookingModal(true)}
              >
                <Ionicons name="cash-outline" size={16} color={tokens.colors.emeraldDeep} />
                <Text style={styles.secondaryActionText}>Adjust Pricing</Text>
              </TouchableOpacity>

              {record.rawData?.user?.email && (
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => {
                    setEmailRecipient(record.rawData.user.email);
                    setShowComposeEmail(true);
                  }}
                >
                  <Ionicons name="mail-outline" size={16} color={tokens.colors.emeraldDeep} />
                  <Text style={styles.secondaryActionText}>Email Driver</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* ── REPORT MANAGEMENT & EDITING ── */}
        {isReport && (
          <>
            <Text style={styles.detailLabel}>Report resolution</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => handleUpdateReportStatus('RESOLVED')}
                disabled={submitting}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={tokens.colors.white} />
                <Text style={styles.primaryActionText}>Mark Resolved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => handleUpdateReportStatus('DISMISSED')}
                disabled={submitting}
              >
                <Ionicons name="close-circle-outline" size={16} color={tokens.colors.emeraldDeep} />
                <Text style={styles.secondaryActionText}>Dismiss Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => handleUpdateReportStatus('OPEN')}
                disabled={submitting}
              >
                <Ionicons name="refresh-outline" size={16} color={tokens.colors.emeraldDeep} />
                <Text style={styles.secondaryActionText}>Reopen</Text>
              </TouchableOpacity>
            </View>

            {record.rawData?.description ? (
              <View style={styles.auditPanel}>
                <Text style={styles.detailLabel}>Report Description</Text>
                <Text style={styles.auditRow}>{record.rawData.description}</Text>
              </View>
            ) : null}
          </>
        )}

        {/* ── EMAIL AUDIT & OUTREACH ── */}
        {isEmail && (
          <>
            <Text style={styles.detailLabel}>Email Content</Text>
            <View style={styles.emailPreviewCard}>
              <Text style={styles.emailPreviewText}>
                {record.rawData?.bodyPreview || 'No text preview recorded.'}
              </Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => {
                  setEmailRecipient(record.rawData?.to || '');
                  setShowComposeEmail(true);
                }}
              >
                <Ionicons name="paper-plane-outline" size={16} color={tokens.colors.white} />
                <Text style={styles.primaryActionText}>Send Follow-up</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── SANCTION CONFIRMATION MODAL ── */}
      <Modal visible={!!pendingAction} transparent animationType="fade" onRequestClose={() => setPendingAction(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setPendingAction(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
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

      {/* ── EDIT USER MODAL ── */}
      <Modal visible={showEditUserModal} transparent animationType="fade" onRequestClose={() => setShowEditUserModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setShowEditUserModal(false)}>
          <Pressable style={styles.editModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit User Account</Text>
            <Text style={styles.modalText}>Adjust profile details, roles, and wallet balance.</Text>

            <ScrollView style={{ marginTop: 14, maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>First Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First Name"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last Name"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Account Role</Text>
                <View style={styles.roleSelectorRow}>
                  {(['USER', 'PROVIDER', 'ADMIN'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.rolePill, editRole === r && styles.rolePillActive]}
                      onPress={() => setEditRole(r)}
                    >
                      <Text style={[styles.rolePillText, editRole === r && styles.rolePillTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Wallet Balance (RON)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editWallet}
                  onChangeText={setEditWallet}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>

              <View style={styles.toggleSwitchRow}>
                <Text style={styles.editFieldLabel}>Email Verified</Text>
                <Switch
                  value={editEmailVerified}
                  onValueChange={setEditEmailVerified}
                  trackColor={{ false: '#D1D5DB', true: tokens.colors.emerald }}
                  thumbColor={tokens.colors.white}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowEditUserModal(false)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleSaveUser} disabled={submitting}>
                {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.modalConfirmText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── EDIT PARKING SPACE MODAL ── */}
      <Modal visible={showEditSpaceModal} transparent animationType="fade" onRequestClose={() => setShowEditSpaceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setShowEditSpaceModal(false)}>
          <Pressable style={styles.editModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Parking Space</Text>
            <Text style={styles.modalText}>Update listing title, hourly price, and description.</Text>

            <ScrollView style={{ marginTop: 14, maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Space Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editSpaceName}
                  onChangeText={setEditSpaceName}
                  placeholder="Name"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Price per Hour (RON)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editSpacePrice}
                  onChangeText={setEditSpacePrice}
                  keyboardType="numeric"
                  placeholder="8.00"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Description</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={editSpaceDesc}
                  onChangeText={setEditSpaceDesc}
                  placeholder="Space description and access instructions"
                  placeholderTextColor={tokens.colors.secondaryText}
                  multiline
                  editable={!submitting}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowEditSpaceModal(false)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleSaveSpace} disabled={submitting}>
                {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.modalConfirmText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── EDIT BOOKING PRICING MODAL ── */}
      <Modal visible={showEditBookingModal} transparent animationType="fade" onRequestClose={() => setShowEditBookingModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setShowEditBookingModal(false)}>
          <Pressable style={styles.editModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Adjust Booking Pricing</Text>
            <Text style={styles.modalText}>Update total charge or security deposit amount.</Text>

            <View style={{ marginTop: 14 }}>
              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Total Price (RON)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editBookingPrice}
                  onChangeText={setEditBookingPrice}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>

              <View style={styles.editFieldGroup}>
                <Text style={styles.editFieldLabel}>Security Deposit (RON)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editBookingDeposit}
                  onChangeText={setEditBookingDeposit}
                  keyboardType="numeric"
                  placeholder="50.00"
                  placeholderTextColor={tokens.colors.secondaryText}
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowEditBookingModal(false)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleSaveBookingPricing} disabled={submitting}>
                {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.modalConfirmText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── COMPOSE CUSTOM EMAIL MODAL ── */}
      <ComposeEmailModal
        visible={showComposeEmail}
        defaultRecipient={emailRecipient}
        onClose={() => setShowComposeEmail(false)}
      />
    </SafeAreaView>
  );
};
