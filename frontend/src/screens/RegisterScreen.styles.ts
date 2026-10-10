import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.emeraldDeep,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: tokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...tokens.shadows.soft,
  },
  logoMark: {
    width: 54,
    height: 54,
  },
  logo: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 36,
    color: tokens.colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  card: {
    padding: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: tokens.typography.body,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: tokens.colors.emerald,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.heading,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: tokens.typography.body,
    color: tokens.colors.secondaryText,
  },
  footerLink: {
    fontFamily: tokens.typography.bodySemiBold,
    color: tokens.colors.emerald,
  }
});
