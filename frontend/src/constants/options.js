// Mirrors backend/src/models/Item.js enums.
// Footwear is intentionally out of scope — keep in sync with backend Item model.
export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'accessory', 'other'];
export const COLOR_FAMILIES = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink',
  'brown', 'black', 'white', 'gray', 'beige', 'multicolor',
];
export const FORMALITY_LEVELS = ['casual', 'smart_casual', 'business', 'formal'];
export const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all_season'];

// Coverage attributes the occasion rules depend on (e.g. Work and School
// exclude sleeveless tops and above-knee hemlines).
export const SLEEVES = ['sleeveless', 'short', 'three_quarter', 'long', 'not_applicable'];
export const NECKLINES = ['high', 'moderate', 'low', 'backless', 'not_applicable'];
export const HEMLINES = ['above_knee', 'knee', 'below_knee', 'midi', 'maxi', 'not_applicable'];
export const GARMENT_STYLES = ['standard', 'crop', 'loungewear', 'activewear', 'beachwear', 'sheer'];
export const FABRICS = [
  'cotton',
  'denim',
  'knit',
  'wool',
  'silk_satin',
  'lace',
  'leather',
  'linen',
  'synthetic',
  'other',
];

// Mirrors backend/src/services/occasionRules.js keys.
export const OCCASIONS = [
  { key: 'work', label: 'Work' },
  { key: 'school', label: 'School' },
  { key: 'wedding_guest', label: 'Wedding Guest' },
  { key: 'date_night', label: 'Date Night' },
  { key: 'beach', label: 'Beach' },
];

export const COLOR_SWATCHES = {
  red: '#D64545',
  orange: '#E08A34',
  yellow: '#E5C93B',
  green: '#4C9A5A',
  blue: '#3B6FCB',
  purple: '#7B5CC7',
  pink: '#D96FA8',
  brown: '#7A5233',
  black: '#222222',
  white: '#F5F5F0',
  gray: '#9A9A9A',
  beige: '#D9C7A3',
  multicolor: '#B8A9D9',
};
