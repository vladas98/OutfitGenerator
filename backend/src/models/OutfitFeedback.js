const mongoose = require('mongoose');

const REASONS = ['wrong_occasion', 'dont_like_combo', 'wrong_weather', 'other'];

const outfitFeedbackSchema = new mongoose.Schema(
  {
    outfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit', required: true, index: true },
    userId: { type: String, required: true, index: true },
    liked: { type: Boolean, required: true },
    reason: { type: String, enum: REASONS },
  },
  { timestamps: true }
);

outfitFeedbackSchema.statics.REASONS = REASONS;

module.exports = mongoose.model('OutfitFeedback', outfitFeedbackSchema);
