// General styling rules that apply across all occasions, independent of
// color theory (colorMatching.js) or occasion-specific constraints (occasionRules.js).

const FORMALITY_LADDER = { casual: 0, smart_casual: 1, business: 2, formal: 3 };

/**
 * Penalizes an outfit for mixing pieces from very different formality levels
 * (e.g. a casual t-shirt with a formal blazer) — a common styling mistake
 * that occasion-level filtering alone doesn't catch, since it only checks each
 * item against the occasion, not items against each other.
 */
function formalitySpreadPenalty(items) {
  const levels = items
    .map((i) => FORMALITY_LADDER[i.formality])
    .filter((level) => level !== undefined);

  if (levels.length < 2) return 0;

  const spread = Math.max(...levels) - Math.min(...levels);
  if (spread === 0) return 0;
  if (spread === 1) return -1;
  return -6;
}

module.exports = { FORMALITY_LADDER, formalitySpreadPenalty };
