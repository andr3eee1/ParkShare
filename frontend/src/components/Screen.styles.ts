import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paleMapBackground },
  flex: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 48,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: tokens.colors.panelSurface,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
    ...tokens.shadows.soft,
  },
  backButtonOnGradient: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerGradient: {
    borderRadius: tokens.radii.upperSheet,
    overflow: 'hidden',
    padding: 18,
    ...tokens.shadows.soft,
  },
  headerSheen: {
    position: 'absolute',
    right: -50,
    top: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: tokens.colors.municipalTeal,
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  eyebrowOnGradient: { color: 'rgba(255, 255, 255, 0.85)' },
  screenTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingBold,
    fontSize: 30,
    marginTop: 3,
  },
  titleOnGradient: { color: tokens.colors.white },
  subtitle: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 3,
  },
  subtitleOnGradient: { color: 'rgba(255, 255, 255, 0.85)' },
});
