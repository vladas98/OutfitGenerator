// Occasion constraints, derived from the styling guidelines. Structured fields
// are enforced as hard filters in outfitCandidates.js; `donts` is passed to
// Claude so its reasoning cites real etiquette rather than just scores.
//
// Work and School share a base ruleset — including the sleeveless hard filter
// and the jeans + t-shirt casual register — but diverge on ceiling: only Work
// generates business-smart outfits, so "business" is excluded from School's
// pool entirely rather than merely deprioritized.

// Shared by Work and School.
const WORKPLACE_BASE = {
  avoidColorFamilies: [],
  avoidPatterns: ['graphic', 'sequin', 'sequins', 'glitter'],
  allowedSeasons: null,
  // The guidelines phrase this as "tops must have sleeves", so it applies to
  // tops only — a sleeveless dress is fine here, and its hemline rule below
  // still governs length. Applying it to dresses too would exclude them all.
  disallowedSleeves: ['sleeveless'],
  disallowedSleevesFor: ['top'],
  disallowedNecklines: ['low', 'backless'],
  // Skirts and dresses need to be knee-length or longer.
  disallowedHemlines: ['above_knee'],
  disallowedGarmentStyles: ['crop', 'loungewear', 'beachwear', 'sheer'],
  // Neutral base with one accent; complementary and triadic pairings are risky here.
  colorRelationAdjustments: { complementary: -2 },
  extraHuePenaltyPerColor: 3,
};

const OCCASION_RULES = {
  work: {
    ...WORKPLACE_BASE,
    // Jeans + t-shirt is an accepted baseline; business smart is the ceiling.
    allowedFormality: ['casual', 'smart_casual', 'business'],
    donts: [
      'No sleeveless tops, crop tops, or visible underwear as outerwear',
      'No pajama/loungewear or beachwear',
      'Skirts and dresses should be knee-length or longer',
      'Keep patterns subtle — no loud graphics, large logos, sequins, or glitter',
      'Lean neutral with a single accent color; avoid neon or highly saturated pairings',
    ],
  },
  school: {
    ...WORKPLACE_BASE,
    // Same floor as Work, but business smart is gated out entirely.
    allowedFormality: ['casual', 'smart_casual'],
    donts: [
      'No sleeveless tops, crop tops, or visible underwear as outerwear',
      'No pajama/loungewear or beachwear',
      'Skirts and dresses should be knee-length or longer',
      'Keep it casual to smart-casual — no business or corporate looks',
      'Lean neutral with a single accent color',
    ],
  },
  date_night: {
    // Dressy and expressive: the top or dress carries the look, so it has to be
    // smart_casual or better. Bottoms are deliberately exempt — jeans under a
    // satin top is a date-night outfit, so pants can be any formality.
    // `formal` is included because a formal satin dress is squarely date-night;
    // excluding it would drop exactly the pieces this occasion wants most.
    // `formal` is deliberately excluded, which is what keeps this occasion
    // distinct from wedding guest (business/formal only). Formal gowns are
    // sleeveless + satin + low-necked, so they sweep three of the four
    // preference bonuses below — a soft preference wasn't enough to stop them
    // dominating, and date night was returning the same dresses as a wedding.
    allowedFormality: ['smart_casual', 'business'],
    formalityExemptCategories: ['bottom'],
    // Sleeveless cuts and satin/lace/leather fabrics are what make this read as
    // date night rather than daywear. These are scored, not required, so the
    // occasion still returns something when nothing matches.
    preferredSleeves: ['sleeveless'],
    preferredFabrics: ['silk_satin', 'lace', 'leather'],
    preferredNecklines: ['low'],
    avoidColorFamilies: [],
    avoidPatterns: [],
    allowedSeasons: null,
    // Sleeveless, low necklines and short hemlines are all welcome here.
    disallowedSleeves: [],
    disallowedNecklines: [],
    disallowedHemlines: [],
    disallowedGarmentStyles: ['loungewear', 'activewear', 'beachwear'],
    // Complementary and jewel-tone combinations are encouraged for impact.
    colorRelationAdjustments: { complementary: 2 },
    extraHuePenaltyPerColor: 1,
    donts: [
      'Avoid plain gym wear, pajamas, or overly casual basics',
      'Avoid head-to-toe workwear — it reads too corporate',
      'Favour sleeveless or strappy cuts and fabrics with sheen (satin, silk, lace, leather)',
      'One focal piece, with the rest of the outfit supporting rather than competing',
      'Do not mix more than one bold pattern',
    ],
  },
  wedding_guest: {
    allowedFormality: ['business', 'formal'],
    // White, ivory, and cream belong to the bride; beige covers cream/pale
    // blush here. Scoped to dress/bottom — the concern is reading as bridal
    // (a white gown or skirt), not a top. A white or beige dress shirt under
    // a jacket is standard menswear, not a faux pas; an unscoped ban was
    // wrongly excluding it.
    avoidColorFamilies: ['white', 'beige'],
    avoidColorFamiliesFor: ['dress', 'bottom'],
    avoidPatterns: ['graphic', 'sequin', 'sequins'],
    allowedSeasons: null,
    disallowedSleeves: [],
    // Only `backless` is blocked outright. The guidelines say to avoid
    // "very low-cut or backless *without a cover-up*" — conditional, not an
    // absolute ban — and the classifier's `low` bucket is coarse enough that
    // it lumps a modest V-neck in with a plunge, so blocking it ruled out
    // most otherwise wedding-appropriate dresses.
    disallowedNecklines: ['backless'],
    disallowedHemlines: ['above_knee'],
    disallowedGarmentStyles: ['crop', 'loungewear', 'activewear', 'beachwear', 'sheer'],
    // Analogous or neutral+accent is safest; keep complementary impact restrained.
    colorRelationAdjustments: { complementary: -1 },
    extraHuePenaltyPerColor: 3,
    donts: [
      'Never wear a white, ivory, cream, or pale blush dress, skirt, or trousers — those are reserved for the bride. A white or beige shirt under a jacket is fine.',
      'Avoid denim, t-shirts, and other overly casual pieces',
      'Avoid anything overly revealing — very low-cut or backless without a cover-up',
      'Midi or maxi lengths are preferred; cocktail-to-formal silhouettes',
    ],
  },
};

const DEFAULT_RULE = {
  allowedFormality: null,
  avoidColorFamilies: [],
  avoidPatterns: [],
  allowedSeasons: null,
  disallowedSleeves: [],
  disallowedNecklines: [],
  disallowedHemlines: [],
  disallowedGarmentStyles: [],
  colorRelationAdjustments: {},
  extraHuePenaltyPerColor: 2,
  donts: [],
};

function getOccasionRule(occasion) {
  const key = String(occasion || '').toLowerCase().replace(/\s+/g, '_');
  return OCCASION_RULES[key] || DEFAULT_RULE;
}

module.exports = { OCCASION_RULES, getOccasionRule, DEFAULT_RULE };
