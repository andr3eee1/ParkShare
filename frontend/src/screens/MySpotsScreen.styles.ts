import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paleMapBackground },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    ...tokens.shadows.soft,
  },
  headerSheen: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  headerTitle: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 26,
    color: tokens.colors.white,
  },
  spotCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  spotImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  spotDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotName: {
    flex: 1,
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginRight: 8,
  },
  deleteButton: {
    padding: 2,
    marginLeft: 4,
  },
  spotPrice: {
    fontFamily: tokens.typography.body,
    color: tokens.colors.secondaryText,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: tokens.colors.emeraldTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: tokens.typography.body,
    color: '#6B7280',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: tokens.colors.municipalTeal,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3,
  }
});
