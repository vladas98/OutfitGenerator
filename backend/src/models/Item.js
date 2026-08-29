const mongoose = require('mongoose');

// Footwear is intentionally out of scope — the app styles clothing only.
const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'accessory', 'other'];
const COLOR_FAMILIES = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink',
  'brown', 'black', 'white', 'gray', 'beige', 'multicolor',
];
const FORMALITY_LEVELS = ['casual', 'smart_casual', 'business', 'formal'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all_season'];
const STATUSES = ['pending', 'classified', 'needs_review'];

// Coverage attributes required by the occasion guidelines — e.g. Work and
// School hard-exclude sleeveless tops and crop tops, which category and
// formality alone can't express.
const SLEEVES = ['sleeveless', 'short', 'three_quarter', 'long', 'not_applicable'];
const NECKLINES = ['high', 'moderate', 'low', 'backless', 'not_applicable'];
const HEMLINES = ['above_knee', 'knee', 'below_knee', 'midi', 'maxi', 'not_applicable'];
const GARMENT_STYLES = ['standard', 'crop', 'loungewear', 'activewear', 'beachwear', 'sheer'];
// Fabric drives occasion feel as much as cut does — satin and lace read dressy
// and are what Date Night leans on, while denim and jersey read casual.
const FABRICS = [
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

const itemSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    category: { type: String, enum: CATEGORIES },
    colorFamily: { type: String, enum: COLOR_FAMILIES },
    colorHex: { type: String },
    pattern: { type: String },
    formality: { type: String, enum: FORMALITY_LEVELS },
    sleeves: { type: String, enum: SLEEVES },
    neckline: { type: String, enum: NECKLINES },
    hemline: { type: String, enum: HEMLINES },
    garmentStyle: { type: String, enum: GARMENT_STYLES },
    fabric: { type: String, enum: FABRICS },
    season: { type: String, enum: SEASONS },
    imageUrl: { type: String, required: true },
    status: { type: String, enum: STATUSES, default: 'pending' },
    classificationError: { type: String },
    // Perceptual fingerprint used to spot re-uploads of the same garment photo.
    imageHash: { type: String },
    // Set at upload time when this item looks like a duplicate of an existing
    // one. The user decides whether to keep it (clears this) or delete it.
    duplicateOfItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  },
  { timestamps: true }
);

itemSchema.statics.CATEGORIES = CATEGORIES;
itemSchema.statics.COLOR_FAMILIES = COLOR_FAMILIES;
itemSchema.statics.FORMALITY_LEVELS = FORMALITY_LEVELS;
itemSchema.statics.SEASONS = SEASONS;
itemSchema.statics.STATUSES = STATUSES;
itemSchema.statics.SLEEVES = SLEEVES;
itemSchema.statics.NECKLINES = NECKLINES;
itemSchema.statics.HEMLINES = HEMLINES;
itemSchema.statics.GARMENT_STYLES = GARMENT_STYLES;
itemSchema.statics.FABRICS = FABRICS;

module.exports = mongoose.model('Item', itemSchema);
