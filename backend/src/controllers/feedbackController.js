const Outfit = require('../models/Outfit');
const OutfitFeedback = require('../models/OutfitFeedback');

async function submitFeedback(req, res, next) {
  try {
    const { outfitId, liked, reason } = req.body;
    if (!outfitId || typeof liked !== 'boolean') {
      return res.status(400).json({ error: 'outfitId and liked (boolean) are required' });
    }

    const outfit = await Outfit.findOne({ _id: outfitId, userId: req.userId });
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });

    const feedback = await OutfitFeedback.create({
      outfitId,
      userId: req.userId,
      liked,
      reason,
    });

    // Liking an outfit files it under Saved. A dislike doesn't unsave, so an
    // outfit the user deliberately kept isn't removed by a later stray tap.
    if (liked && !outfit.saved) {
      outfit.saved = true;
      await outfit.save();
    }

    res.status(201).json({ feedback });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitFeedback };
