import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontFamily: tokens.typography.heading, fontSize: 18, color: tokens.colors.primaryText },
  form: { padding: 24 },
  label: { fontFamily: tokens.typography.heading, fontSize: 14, color: tokens.colors.primaryText, marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontFamily: tokens.typography.body,
  },
  submitButton: {
    backgroundColor: tokens.colors.emerald,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: { color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 16 },
  mapContainer: { height: 250, borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', position: 'relative' },
  centerPin: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20, zIndex: 10, alignItems: 'center', justifyContent: 'center' }
});
