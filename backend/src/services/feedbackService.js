const OutfitFeedback = require('../models/OutfitFeedback');
const Outfit = require('../models/Outfit');
const Item = require('../models/Item');

/**
 * Builds a short natural-language summary of a user's liked/disliked outfit
 * patterns (colors and categories), to feed into future outfit-generation prompts.
 */
async function buildFeedbackSummary(userId) {
  const feedbacks = await OutfitFeedback.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();
  if (feedbacks.length === 0) return null;

  const outfitIds = feedbacks.map((f) => f.outfitId);
  const outfits = await Outfit.find({ _id: { $in: outfitIds } }).lean();
  const outfitById = new Map(outfits.map((o) => [String(o._id), o]));

  const itemIds = outfits.flatMap((o) => o.itemIds.map(String));
  const items = await Item.find({ _id: { $in: itemIds } }).lean();
  const itemById = new Map(items.map((i) => [String(i._id), i]));

  const colorCounts = { liked: {}, disliked: {} };
  const reasonCounts = {};

  for (const fb of feedbacks) {
    const outfit = outfitById.get(String(fb.outfitId));
    if (!outfit) continue;
    const bucket = fb.liked ? colorCounts.liked : colorCounts.disliked;
    for (const itemId of outfit.itemIds) {
      const item = itemById.get(String(itemId));
      if (item?.colorFamily) {
        bucket[item.colorFamily] = (bucket[item.colorFamily] || 0) + 1;
      }
    }
    if (!fb.liked && fb.reason) {
      reasonCounts[fb.reason] = (reasonCounts[fb.reason] || 0) + 1;
    }
  }

  const topN = (obj, n) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);

  const likedColors = topN(colorCounts.liked, 3);
  const dislikedColors = topN(colorCounts.disliked, 3);
  const topReasons = topN(reasonCounts, 2);

  const parts = [];
  if (likedColors.length) parts.push(`tends to like: ${likedColors.join(', ')}`);
  if (dislikedColors.length) parts.push(`tends to dislike: ${dislikedColors.join(', ')}`);
  if (topReasons.length) parts.push(`common complaints: ${topReasons.join(', ')}`);

  return parts.length ? parts.join('; ') : null;
}

module.exports = { buildFeedbackSummary };
