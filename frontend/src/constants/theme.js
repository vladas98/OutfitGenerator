// Shared design tokens. Screens should pull from here rather than hard-coding
// colors and spacing, so the app stays visually consistent as it grows.

export const colors = {
  // Warm off-white ground with a near-black ink, which reads softer than pure
  // black-on-white and suits a styling app.
  background: '#FFFFFF',
  surface: '#F7F5F1',
  surfaceRaised: '#FFFFFF',
  border: '#E7E3DB',
  borderStrong: '#D6D1C6',

  ink: '#1F1D1A',
  inkMuted: '#6E6862',
  inkFaint: '#9C958C',

  accent: '#2F5D50', // deep green — used for primary actions
  accentSoft: '#E8F0EC',

  danger: '#A63D33',
  dangerSoft: '#FBEEEC',

  warning: '#8A6D1F',
  warningSoft: '#FFF8E6',

  onAccent: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const type = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
};

// Subtle lift for cards. Kept light — heavy shadows read dated.
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
};

export default { colors, spacing, radii, type, shadow };
