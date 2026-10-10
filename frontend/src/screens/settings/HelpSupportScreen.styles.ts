import { StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', padding: 18, marginBottom: 14 },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: tokens.colors.emeraldTint,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 14,
    width: 44,
  },
  textContainer: { flex: 1 },
  label: { color: tokens.colors.secondaryText, fontFamily: tokens.typography.body, fontSize: 13, marginBottom: 3 },
  valueText: { color: tokens.colors.primaryText, fontFamily: tokens.typography.bodySemiBold, fontSize: 15 },
  footerText: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
