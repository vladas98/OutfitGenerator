const Item = require('../models/Item');
const Outfit = require('../models/Outfit');
const { buildCandidates, diagnoseShortage } = require('../services/outfitCandidates');
const { getOccasionRule, OCCASION_RULES } = require('../services/occasionRules');
const { chooseOutfit } = require('../services/aiService');
const { buildFeedbackSummary } = require('../services/feedbackService');

async function generateOutfit(req, res, next) {
  try {
    const { occasion, seedItemIds = [], excludeItemIds = [] } = req.body;
    if (!occasion) return res.status(400).json({ error: 'occasion is required' });

    const closetItems = await Item.find({ userId: req.userId, status: 'classified' }).lean();
    if (closetItems.length === 0) {
      return res.status(422).json({ error: 'No classified items in your closet yet' });
    }

    // Downrank whatever we suggested most recently for this occasion, so asking
    // again gives a genuinely different outfit rather than repeating the last one.
    const recentOutfits = await Outfit.find({ userId: req.userId, occasion })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const candidates = buildCandidates(closetItems, occasion, {
      limit: 5,
      recentOutfitItemIds: recentOutfits.map((o) => o.itemIds.map(String)),
      seedItemIds,
      excludeItemIds,
    });
    if (candidates.length === 0) {
      return res.status(422).json({
        error: diagnoseShortage(closetItems, occasion, { seedItemIds, excludeItemIds }),
      });
    }

    const feedbackSummary = await buildFeedbackSummary(req.userId);
    const styleRules = getOccasionRule(occasion).donts;
    const choice = await chooseOutfit(candidates, occasion, styleRules, feedbackSummary);

    const chosenCandidate = candidates[choice.chosenCandidateIndex] ?? candidates[0];

    const outfit = await Outfit.create({
      userId: req.userId,
      occasion,
      itemIds: chosenCandidate.items.map((i) => i._id),
      reasoning: choice.reasoning,
    });

    const populated = await outfit.populate('itemIds');
    res.status(201).json({ outfit: populated });
  } catch (err) {
    next(err);
  }
}

async function listOutfits(req, res, next) {
  try {
    const outfits = await Outfit.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('itemIds');
    res.json({ outfits });
  } catch (err) {
    next(err);
  }
}

// The user thinks a generated outfit suits a different occasion than the one it
// was built for. Re-filing it is both a correction and a signal: the outfit is
// kept as-is, just categorised where the user actually wants it.
async function updateOutfitOccasion(req, res, next) {
  try {
    const { occasion } = req.body;
    if (!occasion) return res.status(400).json({ error: 'occasion is required' });

    const key = String(occasion).toLowerCase().replace(/\s+/g, '_');
    if (!OCCASION_RULES[key]) {
      return res.status(400).json({ error: `Unknown occasion "${occasion}"` });
    }

    const outfit = await Outfit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { occasion: key },
      { new: true }
    ).populate('itemIds');
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });

    res.json({ outfit });
  } catch (err) {
    next(err);
  }
}

async function listSavedOutfits(req, res, next) {
  try {
    const outfits = await Outfit.find({ userId: req.userId, saved: true })
      .sort({ createdAt: -1 })
      .populate('itemIds');
    res.json({ outfits });
  } catch (err) {
    next(err);
  }
}

async function setSaved(req, res, next, saved) {
  try {
    const outfit = await Outfit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { saved },
      { new: true }
    ).populate('itemIds');
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
    res.json({ outfit });
  } catch (err) {
    next(err);
  }
}

const saveOutfit = (req, res, next) => setSaved(req, res, next, true);

// Removes the outfit from Saved without deleting it, so the like/dislike
// history feeding future suggestions is preserved.
const unsaveOutfit = (req, res, next) => setSaved(req, res, next, false);

async function getOutfit(req, res, next) {
  try {
    const outfit = await Outfit.findOne({ _id: req.params.id, userId: req.userId }).populate('itemIds');
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
    res.json({ outfit });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateOutfit,
  listOutfits,
  getOutfit,
  listSavedOutfits,
  saveOutfit,
  unsaveOutfit,
  updateOutfitOccasion,
};
