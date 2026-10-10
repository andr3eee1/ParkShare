export const tokens = {
  colors: {
    // ── Brand core (docs/brand/brand-spec.md §3) ──
    emerald: '#009967', // Emerald 500 — the action color
    emeraldDeep: '#006552', // Emerald 700 — solid fills, pressed states
    emeraldTint: '#D7F8E8', // Emerald 100 — chips, selected, success
    ink: '#101826', // Ink — primary text
    paper: '#F9FAFB', // Paper — light surfaces
    slate: '#62748E', // Slate — muted text
    teal: '#0F766E', // Teal — civic / trust accents
    amber: '#D97706', // Amber — warnings
    danger: '#C24141', // Danger — errors, destructive, unavailable

    // ── Semantic aliases (kept so existing screens don't break) ──
    primaryText: '#101826',
    secondaryText: '#62748E',
    availabilityGreen: '#009967',
    municipalTeal: '#0F766E',
    warningAmber: '#D97706',
    paleMapBackground: '#EDF3F1',
    lightPanelBase: '#F9FAFB',
    background: '#F9FAFB',
    panelSurface: '#FFFFFF',
    white: '#FFFFFF',
    transparentWhite: 'rgba(255, 255, 255, 0.88)', // ~88% opaque
    borderLight: 'rgba(255, 255, 255, 0.5)',

    // ── Surfaces for the green-forward treatment ──
    emeraldWash: '#EAF9F1', // very light green, card/tint backgrounds
    onEmeraldMuted: 'rgba(255, 255, 255, 0.88)',
  },
  gradients: {
    /** Primary brand gradient — matches the app icon (top-left → bottom-right). */
    brand: ['#009967', '#006552'] as [string, string],
    /** Brighter variant for hero cards over imagery. */
    brandBright: ['#00A96E', '#007A5E'] as [string, string],
    /** Soft wash for tinted cards that still read as green. */
    wash: ['#F3FCF8', '#E4F6EC'] as [string, string],
  },
  typography: {
    heading: 'SpaceGrotesk',
    headingMedium: 'SpaceGrotesk_Medium',
    headingBold: 'SpaceGrotesk_Bold',
    body: 'Inter',
    bodyMedium: 'Inter_Medium',
    bodySemiBold: 'Inter_SemiBold',
  },
  radii: {
    topPanel: 16,
    inputControl: 12,
    upperSheet: 26,
    pill: 9999,
  },
  /**
   * Spacing scale — the single source of truth for padding, margin and gap.
   * Prefer these over raw numbers in `*.styles.ts` so rhythm stays consistent.
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadows: {
    soft: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
    },
  },
};
