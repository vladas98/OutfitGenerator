const mongoose = require('mongoose');

const outfitSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    occasion: { type: String, required: true },
    itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true }],
    reasoning: { type: String, required: true },
    // Set when the user likes an outfit, which files it under Saved. Unsaving
    // clears this but keeps the outfit and its feedback, so the preference
    // history that informs future suggestions stays intact.
    saved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Outfit', outfitSchema);
