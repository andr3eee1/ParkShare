import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.borderLight,
    ...tokens.shadows.soft,
  },
  overlay: {
    backgroundColor: tokens.colors.transparentWhite,
  },
});
