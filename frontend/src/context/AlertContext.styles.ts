import { StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 20,
    color: tokens.colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    color: tokens.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: tokens.colors.emerald,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: tokens.radii.inputControl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonDestructive: {
    backgroundColor: tokens.colors.danger,
  },
  buttonCancel: {
    backgroundColor: '#EEF2F5',
  },
  buttonText: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 16,
    color: tokens.colors.white,
  },
  buttonTextDestructive: {
    color: tokens.colors.white,
  },
  buttonTextCancel: {
    color: tokens.colors.primaryText,
  },
});
