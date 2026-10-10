import React, { useMemo, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '../components/GlassPanel';
import { BrandGradient } from '../components/Brand';
import { ReviewModal, PendingReview } from '../components/ReviewModal';
import { useAlert } from '../context/AlertContext';
import { tokens } from '../theme/tokens';
import { apiClient } from '../api/client';
import { styles } from './HistoryScreen.styles';

type BookingStatus = 'Upcoming' | 'Completed' | 'Cancelled';

type MockBooking = {
  id: string;
  reservationId?: string;
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

const statusColors: Record<BookingStatus, { background: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Upcoming: { background: tokens.colors.emeraldTint, text: tokens.colors.availabilityGreen, icon: 'time-outline' },
  Completed: { background: '#E8F1F5', text: tokens.colors.municipalTeal, icon: 'checkmark-circle-outline' },
  Cancelled: { background: '#FDECEC', text: tokens.colors.danger, icon: 'close-circle-outline' },
};

export const HistoryScreen = () => {
  const { token } = useContext(AuthContext);
  const { alert } = useAlert();
  const [bookings, setBookings] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [activeReview, setActiveReview] = useState<PendingReview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await apiClient.get('/bookings/me');
      // Transform backend bookings to UI format
      const transformed = res.data.bookings.map((b: any) => {
        const startDate = new Date(b.startTime);
        const endDate = b.endTime ? new Date(b.endTime) : new Date();
        
        let status = 'Completed';
        if (b.status === 'ACTIVE') status = 'Upcoming';
        else if (b.status === 'CANCELLED') status = 'Cancelled';
          
        let hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        if (hours < 0) hours = 0;

        let timeStr = `${startDate.getHours()}:${startDate.getMinutes().toString().padStart(2, '0')} - `;
        if (b.endTime) {
            timeStr += `${endDate.getHours()}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        } else {
            timeStr += 'Now';
        }

        return {
          id: b.id.substring(0, 8).toUpperCase(),
          reservationId: b.id,
          location: b.spot.name,
          address: 'Lat: ' + b.spot.latitude + ' Lng: ' + b.spot.longitude,
          date: startDate.toLocaleDateString(),
          time: timeStr,
          duration: `${hours.toFixed(1)} hours`,
          vehicle: 'My Vehicle',
          total: b.totalPrice != null ? `${b.totalPrice.toFixed(2)} RON` : 'Pending',
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
  }, []);

  const fetchPendingReviews = useCallback(async () => {
    if (!token) { setPendingReviews([]); return; }
    try {
      const res = await apiClient.get('/reviews/pending');
      setPendingReviews(res.data.pending || []);
    } catch (err) {
      console.warn('Failed to fetch pending reviews', err);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
      fetchPendingReviews();
    }, [fetchBookings, fetchPendingReviews])
  );

  const pendingByReservation = useMemo(() => {
    const map = new Map<string, PendingReview>();
    pendingReviews.forEach((p) => map.set(p.reservationId, p));
    return map;
  }, [pendingReviews]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BrandGradient style={styles.header}>
          <View pointerEvents="none" style={styles.headerSheen} />
          <View>
            <Text style={styles.screenTitle}>History</Text>
            <Text style={styles.subtitle}>Keep track of your parking trips</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={22} color={tokens.colors.white} />
          </View>
        </BrandGradient>

        <GlassPanel style={styles.summaryCard} borderRadius={20} intensity={45} overlayColor={tokens.colors.panelSurface}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name="car-outline" size={21} color={tokens.colors.emerald} />
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
          <Text style={styles.bookingCount}>{bookings.length} {bookings.length === 1 ? 'trip' : 'trips'}</Text>
        </View>

        <View style={styles.bookingList}>
          {bookings.map((booking) => {
            const pending = booking.reservationId ? pendingByReservation.get(booking.reservationId) : undefined;
            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                onRate={pending ? () => setActiveReview(pending) : undefined}
              />
            );
          })}
        </View>

        {bookings.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={tokens.colors.secondaryText} />
            </View>
            <Text style={styles.emptyTitle}>No trips</Text>
            <Text style={styles.emptyText}>Your parking activity will appear here.</Text>
          </View>
        )}
      </ScrollView>

      <ReviewModal
        pending={activeReview}
        onClose={(submitted) => {
          const current = activeReview;
          setActiveReview(null);
          if (current && submitted) {
            setPendingReviews((prev) => prev.filter((p) => p.reservationId !== current.reservationId));
            alert('Thank you!', 'Your review helps keep ParkShare safe and fair.', undefined, 'success');
          }
        }}
      />
    </SafeAreaView>
  );
};

const BookingCard = ({ booking, onRate }: { booking: MockBooking; onRate?: () => void }) => {
  const status = statusColors[booking.status];

  return (
    <GlassPanel style={styles.bookingCard} borderRadius={18} intensity={35} overlayColor={tokens.colors.panelSurface}>
      <View style={styles.cardTopRow}>
        <View style={styles.locationIcon}>
          <Ionicons name={booking.type === 'Private' ? 'home-outline' : 'business-outline'} size={20} color={tokens.colors.emerald} />
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

      {onRate && (
        <TouchableOpacity style={styles.rateButton} onPress={onRate} accessibilityLabel={`Rate ${booking.location}`}>
          <Ionicons name="star" size={15} color="#F5B301" />
          <Text style={styles.rateButtonText}>Rate this trip</Text>
        </TouchableOpacity>
      )}
    </GlassPanel>
  );
};
