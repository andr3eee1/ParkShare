import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    marginBottom: 8,
    color: tokens.colors.primaryText,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontFamily: tokens.typography.body,
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  inputFocused: {
    borderColor: tokens.colors.emerald,
    backgroundColor: tokens.colors.emeraldWash,
  },
  inputError: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: tokens.colors.secondaryText,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: '#991B1B',
    marginLeft: 4,
  },
  helperText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
    marginTop: 6,
  }
});
