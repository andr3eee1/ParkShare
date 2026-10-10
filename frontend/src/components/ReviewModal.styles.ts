import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
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
