const { scoreOutfitColors } = require('./colorMatching');
const { formalitySpreadPenalty } = require('./styleRules');
const { getOccasionRule } = require('./occasionRules');

function passesFormality(item, rule) {
  if (!rule.allowedFormality) return true;
  if (!item.formality) return true;
  // Some occasions exempt a category from the formality floor — Date Night
  // wants a dressy top but will take any pants under it.
  if (rule.formalityExemptCategories?.includes(item.category)) return true;
  return rule.allowedFormality.includes(item.formality);
}

function passesColorRule(item, avoidColorFamilies) {
  if (!avoidColorFamilies || avoidColorFamilies.length === 0) return true;
  return !avoidColorFamilies.includes(item.colorFamily);
}

function passesPatternRule(item, avoidPatterns) {
  if (!avoidPatterns || avoidPatterns.length === 0) return true;
  if (!item.pattern) return true;
  return !avoidPatterns.includes(item.pattern.toLowerCase());
}

function passesSeasonRule(item, allowedSeasons) {
  if (!allowedSeasons) return true;
  if (!item.season) return true;
  return allowedSeasons.includes(item.season);
}

// Coverage constraints from the styling guidelines (no sleeveless tops for work
// or school, knee-length minimum, no crop tops or loungewear, and so on).
// Items classified before these attributes existed have them undefined, and an
// unknown attribute is allowed through rather than silently hiding the item.
function passesCoverageRules(item, rule) {
  const blocked = (value, disallowed) => value && disallowed?.includes(value);

  // Some rules are scoped to particular categories — "tops must have sleeves"
  // shouldn't exclude every sleeveless dress.
  const sleevesApplies =
    !rule.disallowedSleevesFor || rule.disallowedSleevesFor.includes(item.category);

  return !(
    (sleevesApplies && blocked(item.sleeves, rule.disallowedSleeves)) ||
    blocked(item.neckline, rule.disallowedNecklines) ||
    blocked(item.hemline, rule.disallowedHemlines) ||
    blocked(item.garmentStyle, rule.disallowedGarmentStyles)
  );
}

// Rewards the traits an occasion leans toward without excluding everything
// else, so the look skews the right way but the occasion still returns results
// when the closet has nothing matching.
const PREFERENCE_BONUS = 3;

function preferenceBonus(items, rule) {
  // Scored as the *proportion* of relevant pieces that match, not a raw count.
  // Counting meant a two-piece outfit could earn double what a single dress
  // could on the same preference, so dresses lost on arithmetic rather than
  // on style — the same flaw the color scoring had before it was averaged.
  //
  // "Relevant" skips pieces the field can't apply to: a bottom is always
  // `not_applicable` for sleeves and neckline, and shouldn't dilute the score.
  const reward = (field, preferred) => {
    if (!preferred?.length) return 0;
    const relevant = items.filter((i) => i[field] && i[field] !== 'not_applicable');
    if (relevant.length === 0) return 0;
    const matching = relevant.filter((i) => preferred.includes(i[field])).length;
    return matching / relevant.length;
  };

  return (
    PREFERENCE_BONUS *
    (reward('formality', rule.preferredFormality) +
      reward('sleeves', rule.preferredSleeves) +
      reward('fabric', rule.preferredFabrics) +
      reward('neckline', rule.preferredNecklines))
  );
}

function scoreCandidate(items, rule) {
  const { total, relations } = scoreOutfitColors(items, {
    relationAdjustments: rule.colorRelationAdjustments,
    extraHuePenaltyPerColor: rule.extraHuePenaltyPerColor,
  });
  const score = total + formalitySpreadPenalty(items) + preferenceBonus(items, rule);
  return { total: score, relations };
}

// How far below the best score a candidate can be and still be considered
// "good enough" to show. Sampling randomly from this band is what keeps
// repeat generations from returning the identical outfit every time.
const SCORE_BAND_TOLERANCE = 4;

/**
 * Penalizes candidates that repeat a recently generated outfit, so asking for
 * a second suggestion actually produces something different. An exact repeat is
 * penalized hardest; partial overlap proportionally less.
 */
function repeatPenalty(candidateItems, recentIdSets) {
  if (!recentIdSets || recentIdSets.length === 0) return 0;

  const ids = candidateItems.map((i) => String(i._id));
  let worst = 0;
  for (const recent of recentIdSets) {
    const overlap = ids.filter((id) => recent.has(id)).length;
    if (overlap === 0) continue;
    const isExactRepeat = overlap === ids.length && recent.size === ids.length;
    const penalty = isExactRepeat ? 10 : 3 * overlap;
    worst = Math.max(worst, penalty);
  }
  return -worst;
}

// How much one recent reappearance of a single piece costs. Separate from
// repeatPenalty, which only catches a *whole outfit* repeating — it uses
// Math.max across recent outfits, so a piece that reappears in 4 of the last
// 5 generations (each time paired with a different other piece) scored the
// same tiny penalty as reappearing once, since no single recent outfit fully
// matched. A dominant neutral piece (scores well with everything) could ride
// that gap indefinitely: different outfit each time by the system's own
// bookkeeping, same top every time from the user's seat. This sums instead of
// capping, so repeats actually accumulate a cost.
const ITEM_RECENCY_WEIGHT = 2.5;

function recentItemPenalty(candidateItems, recentIdSets) {
  if (!recentIdSets || recentIdSets.length === 0) return 0;
  let occurrences = 0;
  for (const item of candidateItems) {
    const id = String(item._id);
    occurrences += recentIdSets.filter((set) => set.has(id)).length;
  }
  return -occurrences * ITEM_RECENCY_WEIGHT;
}

// Smaller than ITEM_RECENCY_WEIGHT, and deliberately fuzzier: this is what
// stops "different beige top, same beige top" from reading as variety. Two
// distinct beige tops each satisfy the exact-item penalty above on their own,
// since neither individual item repeats often — but a user who owns two
// beige tops and one each of white/blue sees "beige" far more than a third of
// the time regardless of which physical beige item was used. This tracks
// category+color pairs actually worn recently, not item identity.
const CATEGORY_COLOR_RECENCY_WEIGHT = 2;

function recentCategoryColorPenalty(candidateItems, recentOutfitItemIds, itemById) {
  if (!recentOutfitItemIds || recentOutfitItemIds.length === 0) return 0;
  let occurrences = 0;
  for (const item of candidateItems) {
    for (const recentIds of recentOutfitItemIds) {
      const wornSameSlot = recentIds.some((id) => {
        const recentItem = itemById.get(String(id));
        return (
          recentItem &&
          recentItem.category === item.category &&
          recentItem.colorFamily === item.colorFamily
        );
      });
      if (wornSameSlot) occurrences++;
    }
  }
  return -occurrences * CATEGORY_COLOR_RECENCY_WEIGHT;
}

function shuffle(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds outfit candidates (base of top+bottom, or dress) plus optional
 * outerwear/accessory, filtered by occasion rules and scored by color
 * theory plus formality consistency across pieces.
 *
 * Rather than always returning the single best-scoring combinations (which made
 * repeat generations return the same outfit every time), this collects every
 * candidate scoring near the best, shuffles that band, and returns `limit` of
 * them — so suggestions stay high quality but vary between requests.
 *
 * @param {object[]} items - the user's classified closet items
 * @param {string} occasion
 * @param {object} [options]
 * @param {number} [options.limit] - how many candidates to hand to the model
 * @param {string[][]} [options.recentOutfitItemIds] - item ids of recent outfits, to downrank
 * @param {string[]} [options.seedItemIds] - items the outfit must include (build around these)
 * @param {string[]} [options.excludeItemIds] - items the outfit must not use (e.g. one being replaced)
 */
function buildCandidates(
  items,
  occasion,
  { limit = 5, recentOutfitItemIds = [], seedItemIds = [], excludeItemIds = [] } = {}
) {
  const rule = getOccasionRule(occasion);
  const excluded = new Set(excludeItemIds.map(String));
  const seeds = seedItemIds.map(String);
  const itemById = new Map(items.map((i) => [String(i._id), i]));

  const eligible = items.filter((item) => {
    if (excluded.has(String(item._id))) return false;
    // A seed was chosen deliberately by the user, so it bypasses the occasion
    // filters — otherwise picking, say, a casual top for "work" would silently
    // return nothing instead of styling around it.
    if (seeds.includes(String(item._id))) return item.status === 'classified';
    return (
      item.status === 'classified' &&
      passesFormality(item, rule) &&
      passesColorRule(item, rule.avoidColorFamilies) &&
      passesPatternRule(item, rule.avoidPatterns) &&
      passesSeasonRule(item, rule.allowedSeasons) &&
      passesCoverageRules(item, rule)
    );
  });

  const byCategory = (cat) => eligible.filter((i) => i.category === cat);
  const tops = byCategory('top');
  const bottoms = byCategory('bottom');
  const dresses = byCategory('dress');
  const outerwear = byCategory('outerwear');
  const accessories = byCategory('accessory');

  const bases = [];
  for (const top of tops) {
    for (const bottom of bottoms) {
      bases.push([top, bottom]);
    }
  }
  for (const dress of dresses) {
    bases.push([dress]);
  }

  const isSeed = (item) => seeds.includes(String(item._id));
  // Layer pieces the user explicitly seeded must always be present, not merely
  // considered — otherwise "build around this jacket" would drop the jacket
  // whenever it didn't happen to raise the score.
  const seededLayers = [...outerwear, ...accessories].filter(isSeed);
  const optionalLayers = [...outerwear, ...accessories].filter((i) => !isSeed(i));

  const candidates = [];
  for (const base of bases) {
    const core = [...base, ...seededLayers];
    const { total, relations } = scoreCandidate(core, rule);

    // Try adding one more layer on top, if it doesn't clash.
    let best = { items: core, score: total, relations };
    for (const extra of optionalLayers) {
      const withExtra = [...core, extra];
      const scored = scoreCandidate(withExtra, rule);
      if (scored.total >= best.score) {
        best = { items: withExtra, score: scored.total, relations: scored.relations };
      }
    }
    candidates.push(best);
  }

  // Keep only outfits that actually contain every seed the user locked in.
  const withSeeds =
    seeds.length === 0
      ? candidates
      : candidates.filter((c) => {
          const ids = c.items.map((i) => String(i._id));
          return seeds.every((seed) => ids.includes(seed));
        });

  if (withSeeds.length === 0) return [];

  const recentIdSets = recentOutfitItemIds.map((ids) => new Set(ids.map(String)));
  const adjusted = withSeeds.map((c) => ({
    ...c,
    score:
      c.score +
      repeatPenalty(c.items, recentIdSets) +
      recentItemPenalty(c.items, recentIdSets) +
      recentCategoryColorPenalty(c.items, recentOutfitItemIds, itemById),
  }));

  adjusted.sort((a, b) => b.score - a.score);

  // Keep everything scoring close to the best, then pick from that band at
  // random so repeat requests surface different (but still good) outfits.
  const bestScore = adjusted[0].score;
  const band = adjusted.filter((c) => c.score >= bestScore - SCORE_BAND_TOLERANCE);

  return shuffle(band).slice(0, limit);
}

/**
 * Explains why no outfit could be built, so the UI can say what's actually
 * missing ("no other bottoms fit work") instead of a generic "add more items".
 * Only called when buildCandidates returns nothing.
 */
function diagnoseShortage(items, occasion, { seedItemIds = [], excludeItemIds = [] } = {}) {
  const rule = getOccasionRule(occasion);
  const excluded = new Set(excludeItemIds.map(String));
  const seeds = seedItemIds.map(String);

  const usable = items.filter(
    (item) =>
      item.status === 'classified' &&
      !excluded.has(String(item._id)) &&
      (seeds.includes(String(item._id)) ||
        (passesFormality(item, rule) &&
          passesColorRule(item, rule.avoidColorFamilies) &&
          passesPatternRule(item, rule.avoidPatterns) &&
          passesSeasonRule(item, rule.allowedSeasons) &&
          passesCoverageRules(item, rule)))
  );

  const count = (cat) => usable.filter((i) => i.category === cat).length;
  const label = String(occasion).replace(/_/g, ' ');
  const replacing = excludeItemIds.length > 0;
  const suffix = replacing ? ' once that piece is swapped out' : '';

  // A seeded top or bottom rules out dress-based outfits, so a spare dress
  // doesn't rescue a missing top or bottom in that case.
  const seededCategories = usable
    .filter((i) => seeds.includes(String(i._id)))
    .map((i) => i.category);
  const dressPossible = count('dress') > 0 && !seededCategories.some((c) => c === 'top' || c === 'bottom');

  if (!dressPossible) {
    if (count('top') === 0) return `No tops in your closet fit ${label}${suffix}.`;
    if (count('bottom') === 0) return `No bottoms in your closet fit ${label}${suffix}.`;
  }
  if (seeds.length > 0) {
    return `Couldn't build a ${label} outfit around that item — nothing in your closet pairs with it.`;
  }
  return `Not enough items in your closet fit ${label} yet.`;
}

module.exports = { buildCandidates, diagnoseShortage };
