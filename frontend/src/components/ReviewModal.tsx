import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { apiClient } from '../api/client';

export interface PendingReview {
  reservationId: string;
  role: 'DRIVER' | 'OWNER';
  spot?: { id: string; name: string } | null;
  driver?: { firstName: string; lastName: string } | null;
}

interface Props {
  pending: PendingReview | null;
  onClose: (submitted: boolean) => void;
}

const LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
const MAX_COMMENT = 500;

/**
 * Rate a completed booking.
 *  - DRIVER rates the parking spot.
 *  - OWNER rates the driver (affects their trust score & future deposits).
 */
export const ReviewModal: React.FC<Props> = ({ pending, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRating(0);
    setComment('');
    setError(null);
    setSubmitting(false);
  }, [pending?.reservationId]);

  if (!pending) return null;

  const isDriver = pending.role === 'DRIVER';
  const title = isDriver ? 'How was your parking?' : 'Rate your guest';
  const subject = isDriver
    ? pending.spot?.name || 'this spot'
    : `${pending.driver?.firstName ?? 'Driver'} ${pending.driver?.lastName?.charAt(0) ?? ''}.`;

  const submit = async () => {
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/reviews', {
        reservationId: pending.reservationId,
        rating,
        comment: comment.trim() || undefined,
      });
      onClose(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      if (status === 409) {
        onClose(true); // already reviewed – treat as done
        return;
      }
      setError(typeof msg === 'string' ? msg : 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <Pressable style={styles.overlay} onPress={() => !submitting && onClose(false)}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={() => onClose(false)} disabled={submitting} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={tokens.colors.primaryText} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subject}>{subject}</Text>

          <View style={styles.stars} accessibilityRole="adjustable">
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => { setRating(n); setError(null); }}
                disabled={submitting}
                accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={40} color="#F5B301" style={{ marginHorizontal: 4 }} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>{rating ? LABELS[rating] : 'Tap to rate'}</Text>

          <TextInput
            style={styles.input}
            placeholder={isDriver ? 'Was the spot easy to find and as described? (optional)' : 'Did the driver respect the spot and timing? (optional)'}
            placeholderTextColor={tokens.colors.secondaryText}
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, MAX_COMMENT))}
            multiline
            editable={!submitting}
          />
          <Text style={styles.counter}>{comment.length}/{MAX_COMMENT}</Text>

          {!isDriver && (
            <Text style={styles.hint}>Your rating affects this driver's trust score and their security deposit.</Text>
          )}
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={[styles.submit, (rating < 1 || submitting) && styles.submitDisabled]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.submitText}>Submit Review</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onClose(false)} disabled={submitting} style={{ alignItems: 'center', paddingTop: 12 }}>
            <Text style={styles.skip}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/** Compact star rating display, e.g. ★ 4.8 (12) */
export const RatingBadge: React.FC<{ rating?: number | null; count?: number | null }> = ({ rating, count }) => {
  if (!count) {
    return (
      <View style={styles.badge}>
        <Ionicons name="sparkles-outline" size={13} color={tokens.colors.secondaryText} />
        <Text style={styles.badgeNew}>New</Text>
      </View>
    );
  }
  return (
    <View style={styles.badge}>
      <Ionicons name="star" size={13} color="#F5B301" />
      <Text style={styles.badgeText}>{(rating ?? 0).toFixed(1)}</Text>
      <Text style={styles.badgeCount}>({count})</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: tokens.colors.white, borderRadius: 20, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: tokens.typography.heading, fontSize: 20, color: tokens.colors.primaryText },
  subject: { fontFamily: tokens.typography.body, fontSize: 15, color: tokens.colors.secondaryText, marginTop: 4 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  ratingLabel: { textAlign: 'center', marginTop: 8, fontFamily: tokens.typography.body, fontSize: 14, color: tokens.colors.secondaryText },
  input: {
    marginTop: 20, minHeight: 80, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12,
    fontFamily: tokens.typography.body, fontSize: 14, color: tokens.colors.primaryText, textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: tokens.colors.secondaryText, marginTop: 4 },
  hint: { fontSize: 12, color: tokens.colors.secondaryText, marginTop: 8 },
  error: { color: tokens.colors.danger, marginTop: 8, fontSize: 13 },
  submit: { marginTop: 16, backgroundColor: tokens.colors.emerald, borderRadius: 12, padding: 14, alignItems: 'center' },
  submitDisabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 16 },
  skip: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 14 },
  badge: { flexDirection: 'row', alignItems: 'center' },
  badgeText: { marginLeft: 3, fontSize: 13, fontWeight: '600', color: tokens.colors.primaryText },
  badgeCount: { marginLeft: 2, fontSize: 12, color: tokens.colors.secondaryText },
  badgeNew: { marginLeft: 3, fontSize: 12, color: tokens.colors.secondaryText },
});
