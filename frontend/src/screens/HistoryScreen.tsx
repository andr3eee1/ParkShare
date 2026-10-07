import React, { useMemo, useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator } from 'react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../components/GlassPanel';
import { tokens } from '../theme/tokens';
import { apiClient } from '../api/client';
import { fromBucharestDBTime } from '../utils/timezone';

type BookingStatus = 'Upcoming' | 'Completed' | 'Cancelled';
type HistoryFilter = 'All' | BookingStatus;

type MockBooking = {
  id: string;
  location: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  vehicle: string;
  total: string;
  status: BookingStatus;
  type: 'Private' | 'Municipal';
};

const mockBookings: MockBooking[] = [
  {
    id: 'PS-1048',
    location: 'Piața Romană Residence',
    address: 'Strada Mihai Eminescu 12, Bucharest',
    date: 'Today, Oct 5',
    time: '09:00 – 12:00',
    duration: '3 hours',
    vehicle: 'B 123 ABC',
    total: '39 lei',
    status: 'Upcoming',
    type: 'Private',
  },
  {
    id: 'PS-1039',
    location: 'Universitate Central Parking',
    address: 'Bulevardul Regina Elisabeta 3',
    date: 'Oct 2, 2026',
    time: '18:30 – 21:30',
    duration: '3 hours',
    vehicle: 'B 123 ABC',
    total: '27 lei',
    status: 'Completed',
    type: 'Municipal',
  },
  {
    id: 'PS-1017',
    location: 'Calea Victoriei Loft',
    address: 'Calea Victoriei 68, Bucharest',
    date: 'Sep 27, 2026',
    time: '10:00 – 14:00',
    duration: '4 hours',
    vehicle: 'B 123 ABC',
    total: '64 lei',
    status: 'Completed',
    type: 'Private',
  },
  {
    id: 'PS-998',
    location: 'Tineretului Park',
    address: 'Strada Șerban Vodă 88',
    date: 'Sep 21, 2026',
    time: '08:00 – 10:00',
    duration: '2 hours',
    vehicle: 'B 123 ABC',
    total: '18 lei',
    status: 'Cancelled',
    type: 'Municipal',
  },
];

const filters: HistoryFilter[] = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const statusColors: Record<BookingStatus, { background: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Upcoming: { background: '#E6F5EE', text: tokens.colors.availabilityGreen, icon: 'time-outline' },
  Completed: { background: '#E8F1F5', text: tokens.colors.municipalTeal, icon: 'checkmark-circle-outline' },
  Cancelled: { background: '#FDECEC', text: '#C24141', icon: 'close-circle-outline' },
};

export const HistoryScreen = () => {
  const { token } = useContext(AuthContext);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('All');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/me');
      // Transform backend bookings to UI format
      const transformed = res.data.bookings.map((b: any) => {
        const startDate = fromBucharestDBTime(new Date(b.startTime));
        const endDate = fromBucharestDBTime(new Date(b.endTime));
        
        let status = 'Completed';
        if (b.status === 'ACTIVE') status = 'Upcoming';
        else if (b.status === 'CANCELLED') status = 'Cancelled';
          
        const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

        return {
          id: b.id.substring(0, 8).toUpperCase(),
          location: b.spot.name,
          address: 'Lat: ' + b.spot.latitude + ' Lng: ' + b.spot.longitude,
          date: startDate.toLocaleDateString(),
          time: `${startDate.getHours()}:${startDate.getMinutes().toString().padStart(2, '0')} - ${endDate.getHours()}:${endDate.getMinutes().toString().padStart(2, '0')}`,
          duration: `${hours.toFixed(1)} hours`,
          vehicle: 'My Vehicle',
          total: `${b.totalPrice.toFixed(2)} RON`,
          status: status as BookingStatus,
          type: 'Private'
        };
      });
      setBookings(transformed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleBookings = useMemo(
    () => activeFilter === 'All' ? bookings : bookings.filter((booking) => booking.status === activeFilter),
    [activeFilter, bookings],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>History</Text>
            <Text style={styles.subtitle}>Keep track of your parking trips</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={22} color={tokens.colors.primaryText} />
          </View>
        </View>

        <GlassPanel style={styles.summaryCard} borderRadius={20} intensity={45} overlayColor={tokens.colors.panelSurface}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name="car-outline" size={21} color={tokens.colors.municipalTeal} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Your parking activity</Text>
              <Text style={styles.summaryCaption}>Since joining ParkShare</Text>
            </View>
            <Ionicons name="trending-up-outline" size={22} color={tokens.colors.availabilityGreen} />
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>12</Text>
              <Text style={styles.metricLabel}>Trips</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>34h</Text>
              <Text style={styles.metricLabel}>Parked</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>286 lei</Text>
              <Text style={styles.metricLabel}>Spent</Text>
            </View>
          </View>
        </GlassPanel>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your bookings</Text>
          <Text style={styles.bookingCount}>{visibleBookings.length} {visibleBookings.length === 1 ? 'trip' : 'trips'}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.bookingList}>
          {visibleBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
        </View>

        {visibleBookings.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={tokens.colors.secondaryText} />
            </View>
            <Text style={styles.emptyTitle}>No {activeFilter.toLowerCase()} trips</Text>
            <Text style={styles.emptyText}>Your parking activity will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const BookingCard = ({ booking }: { booking: MockBooking }) => {
  const status = statusColors[booking.status];

  return (
    <GlassPanel style={styles.bookingCard} borderRadius={18} intensity={35} overlayColor={tokens.colors.panelSurface}>
      <View style={styles.cardTopRow}>
        <View style={styles.locationIcon}>
          <Ionicons name={booking.type === 'Private' ? 'home-outline' : 'business-outline'} size={20} color={tokens.colors.municipalTeal} />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName} numberOfLines={1}>{booking.location}</Text>
          <Text style={styles.address} numberOfLines={1}>{booking.address}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <Ionicons name={status.icon} size={14} color={status.text} />
          <Text style={[styles.statusText, { color: status.text }]}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-clear-outline" size={16} color={tokens.colors.secondaryText} />
          <Text style={styles.detailText}>{booking.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={tokens.colors.secondaryText} />
          <Text style={styles.detailText}>{booking.time}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>{booking.vehicle} · {booking.duration}</Text>
          <Text style={styles.bookingId}>Booking {booking.id}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{booking.total}</Text>
          <Text style={styles.priceLabel}>total</Text>
        </View>
      </View>
    </GlassPanel>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingBold,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    marginTop: 4,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...tokens.shadows.soft,
  },
  summaryCard: {
    padding: 18,
    marginBottom: 26,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: '#DDF1EB',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  summaryText: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 15,
  },
  summaryCaption: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 12,
    marginTop: 3,
  },
  metricsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingBold,
    fontSize: 20,
  },
  metricLabel: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 12,
    marginTop: 2,
  },
  metricDivider: {
    backgroundColor: '#DDE3E7',
    height: 32,
    width: 1,
  },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingMedium,
    fontSize: 20,
  },
  bookingCount: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 12,
  },
  filterRow: {
    paddingBottom: 16,
  },
  filterButton: {
    backgroundColor: tokens.colors.panelSurface,
    borderColor: '#E2E7EA',
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  filterButtonActive: {
    backgroundColor: tokens.colors.primaryText,
    borderColor: tokens.colors.primaryText,
  },
  filterText: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.bodyMedium,
    fontSize: 13,
  },
  filterTextActive: {
    color: tokens.colors.white,
  },
  bookingList: {
    gap: 12,
  },
  bookingCard: {
    padding: 16,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  locationIcon: {
    alignItems: 'center',
    backgroundColor: '#E7F0F2',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  locationName: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 15,
  },
  address: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 11,
    marginTop: 4,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: tokens.radii.pill,
    flexDirection: 'row',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: tokens.typography.bodyMedium,
    fontSize: 11,
    marginLeft: 4,
  },
  detailsRow: {
    borderBottomColor: '#E4E9EC',
    borderBottomWidth: 1,
    borderTopColor: '#E4E9EC',
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  detailText: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.body,
    fontSize: 12,
    marginLeft: 6,
  },
  cardFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  footerLabel: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.bodyMedium,
    fontSize: 12,
  },
  bookingId: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 11,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingBold,
    fontSize: 17,
  },
  priceLabel: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 10,
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#E1E7EA',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingMedium,
    fontSize: 17,
    marginTop: 14,
  },
  emptyText: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 5,
  },
});