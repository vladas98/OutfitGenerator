// Color-family relationships used to score outfit candidates before they ever
// reach Claude, per the "grounded in real color theory" requirement.

const NEUTRALS = new Set(['black', 'white', 'gray', 'beige', 'multicolor']);

// Order around a simplified 7-family color wheel (brown treated as a neutral-ish
// dark warm tone, so it's excluded from wheel math and handled as a soft neutral).
const WHEEL = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const SOFT_NEUTRAL = new Set(['brown']);

function wheelIndex(family) {
  const i = WHEEL.indexOf(family);
  return i === -1 ? null : i;
}

/**
 * Classifies the relationship between two color families.
 * Returns { relation, score } where score is higher for more pleasing pairings.
 * relation: 'same' | 'neutral' | 'monochromatic' | 'analogous' | 'complementary' | 'clash'
 */
function matchColors(familyA, familyB) {
  if (!familyA || !familyB) return { relation: 'unknown', score: 0 };
  if (familyA === familyB) return { relation: 'monochromatic', score: 3 };
  if (NEUTRALS.has(familyA) || NEUTRALS.has(familyB)) return { relation: 'neutral', score: 4 };
  if (SOFT_NEUTRAL.has(familyA) || SOFT_NEUTRAL.has(familyB)) return { relation: 'neutral', score: 3 };

  const iA = wheelIndex(familyA);
  const iB = wheelIndex(familyB);
  if (iA === null || iB === null) return { relation: 'unknown', score: 1 };

  const distance = Math.min(Math.abs(iA - iB), WHEEL.length - Math.abs(iA - iB));

  if (distance === 1) return { relation: 'analogous', score: 3 };
  // 7-family wheel: "opposite" is 3-4 steps away.
  if (distance === 3 || distance === 4) return { relation: 'complementary', score: 3 };
  return { relation: 'clash', score: 0 };
}

function isNeutral(family) {
  return NEUTRALS.has(family) || SOFT_NEUTRAL.has(family);
}

// A single-piece outfit (a dress on its own) has no colors that can clash, so
// its harmony matches an ideal pairing. Scoring it lower was penalizing dresses
// for having fewer pieces, which kept them out of results entirely.
const SOLO_HARMONY = 4;
// Pairwise averages are rescaled to this many pairs, keeping score magnitudes
// in the same range the occasion tuning was calibrated against.
const REFERENCE_PAIRS = 3;

/**
 * Scores a full outfit (array of items, each with colorFamily) by summing
 * pairwise relationship scores, then applying outfit-level adjustments from the
 * styling guidelines:
 *  - a penalty for stacking extra non-neutral hues (reads as busy)
 *  - a bonus when the outfit is anchored by at least one neutral item
 *  - a penalty for pairing two patterned garments
 *  - per-occasion weighting of pairing strategies (complementary is encouraged
 *    for date night but risky for work, school, and wedding guest)
 *
 * @param {object[]} items
 * @param {object} [options]
 * @param {Record<string, number>} [options.relationAdjustments] - per-relation score tweaks
 * @param {number} [options.extraHuePenaltyPerColor] - cost of each hue beyond the second
 */
function scoreOutfitColors(items, { relationAdjustments = {}, extraHuePenaltyPerColor = 2 } = {}) {
  let pairTotal = 0;
  let pairCount = 0;
  const relations = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const { relation, score } = matchColors(items[i].colorFamily, items[j].colorFamily);
      pairTotal += score + (relationAdjustments[relation] || 0);
      pairCount++;
      relations.push({ a: items[i].category, b: items[j].category, relation });
    }
  }

  // Average the pairwise harmony instead of summing it, then rescale, so
  // outfits with different piece counts stay comparable. Summing meant a solo
  // dress (no pairs at all) scored zero and could never beat a top + bottom —
  // losing on arithmetic rather than on style.
  const harmony = pairCount > 0 ? pairTotal / pairCount : SOLO_HARMONY;
  let total = harmony * REFERENCE_PAIRS;

  // Two dominant colors plus neutrals is the safe default; a third reads busy —
  // less so when it only appears on a small accessory.
  const nonNeutral = items.filter((i) => i.colorFamily && !isNeutral(i.colorFamily));
  const hues = new Set(nonNeutral.map((i) => i.colorFamily));
  if (hues.size >= 3) {
    const accessoryOnlyHues = [...hues].filter((hue) =>
      nonNeutral.filter((i) => i.colorFamily === hue).every((i) => i.category === 'accessory')
    ).length;
    const costedHues = Math.max(0, hues.size - 2 - accessoryOnlyHues);
    total -= extraHuePenaltyPerColor * costedHues;
  }

  if (items.some((i) => isNeutral(i.colorFamily))) {
    total += 2;
  }

  // A patterned piece should be paired with solids, not another pattern.
  const patterned = items.filter(
    (i) => i.pattern && i.pattern.toLowerCase() !== 'solid' && i.category !== 'accessory'
  );
  if (patterned.length >= 2) {
    total -= 3 * (patterned.length - 1);
  }

  return { total, relations };
}

module.exports = { matchColors, scoreOutfitColors, NEUTRALS, WHEEL };
