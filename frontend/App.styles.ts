import { StyleSheet } from 'react-native';
import { tokens } from './src/theme/tokens';

export const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#EEF2F5',
  },
  mobileContainer: {
    // Deprecated fixed size constraints
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.paleMapBackground,
  },
  loadingMark: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  loadingTitle: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 28,
    color: tokens.colors.primaryText,
  },
});
