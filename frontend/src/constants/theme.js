// Shared design tokens. Screens should pull from here rather than hard-coding
// colors and spacing, so the app stays visually consistent as it grows.
//
// Direction: fashion-editorial (Zara-app-like structure — lots of white space,
// hairline borders instead of shadows, uppercase tracked labels, a serif
// display face for headings) with a dusty-rose accent carrying the "girly"
// feel instead of playful color, so it reads elegant rather than childish.

export const fonts = {
  serif: 'PlayfairDisplay_500Medium',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
};

export const colors = {
  background: '#FFFFFF',
  surface: '#FAF7F5',
  surfaceRaised: '#FFFFFF',
  border: '#E9E2DD',
  borderStrong: '#D8CCC5',

  ink: '#211C1D',
  inkMuted: '#7A6F6C',
  inkFaint: '#B3A9A5',

  accent: '#B9737E', // dusty rose — primary actions, the "girly" signal
  accentDeep: '#9C5560', // pressed / emphasis state of the accent
  accentSoft: '#F7E9EB', // pale blush surfaces (badges, highlighted sections)

  danger: '#A63D33',
  dangerSoft: '#FBEEEC',

  warning: '#96702E',
  warningSoft: '#FBF2E3',

  onAccent: '#FFFFFF',
};

// On a phone this never matters — every device is narrower than this. On the
// web build it's the difference between tiles/images sized for a phone
// screen and the same percentage-based layout stretching to a full desktop
// browser window (a 3-column grid tile at 31.5% of a 1500px window is ~470px
// — not a thumbnail). Every screen's root container caps against this.
export const layout = {
  maxContentWidth: 640,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Sharper corners than a typical app — editorial fashion UI reads as
// considered rather than "friendly" when it isn't overly rounded. `pill` is
// kept only for things that are naturally circular (dots, small badges).
export const radii = {
  sm: 2,
  md: 4,
  lg: 6,
  pill: 999,
};

export const type = {
  // Serif, sentence case — a magazine headline, not a shouting banner.
  display: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 32,
    letterSpacing: -0.3,
    lineHeight: 38,
  },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 21, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.serif, fontSize: 16 },
  subtitleItalic: { fontFamily: fonts.serifItalic, fontSize: 15, lineHeight: 21 },

  body: { fontSize: 15, fontWeight: '400' },
  // Uppercase + tracked: the Zara button/tab/tag treatment.
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontSize: 12, fontWeight: '400' },
  // The small tracked section labels ("CATEGORY", "WHY THIS WORKS").
  overline: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
};

// Flat by default — hairline borders carry separation instead of drop
// shadows, which is what keeps this reading as editorial rather than "appy".
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
};

export default { colors, spacing, radii, type, shadow, fonts, layout };
