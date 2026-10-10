import { StyleSheet } from 'react-native';
import { tokens } from './tokens';

/**
 * Shared composite styles used by more than one screen.
 *
 * Screen-local `*.styles.ts` files should import from here before defining
 * their own bespoke rules, so genuinely repeated patterns live in one place.
 */
export const commonStyles = StyleSheet.create({
  /** Centered placeholder card used by settings/coming-soon screens. */
  placeholderCard: { padding: 28, alignItems: 'center' },
  placeholderIcon: {
    alignItems: 'center',
    backgroundColor: tokens.colors.emeraldTint,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    width: 56,
  },
  placeholderTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingMedium,
    fontSize: 17,
  },
  placeholderBody: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
