const mongoose = require('mongoose');
const Item = require('../models/Item');
const ItemImage = require('../models/ItemImage');
const { classifyItem } = require('../services/aiService');
const { computeImageHash, isProbableDuplicate } = require('../services/imageHash');

/**
 * Fingerprints each uploaded image and flags any that look like a photo the
 * user already has — either already in their closet, or repeated earlier in
 * this same batch. Flagged items are still created (so the UI can show them
 * side by side); the user decides whether to keep or delete them.
 */
async function detectDuplicates(files, userId) {
  const hashes = await Promise.all(
    files.map((file) =>
      computeImageHash(file.buffer).catch((err) => {
        console.error(`Could not hash ${file.originalname}:`, err.message);
        return null;
      })
    )
  );

  const existing = await Item.find({ userId, imageHash: { $ne: null } })
    .select('_id imageHash')
    .lean();

  // Ids are assigned up front so an item can reference an earlier one in this
  // same batch as its duplicate source.
  const ids = files.map(() => new mongoose.Types.ObjectId());

  const duplicateOf = files.map((_, index) => {
    const hash = hashes[index];
    if (!hash) return null;

    const priorInBatch = hashes.findIndex((h, j) => j < index && h && isProbableDuplicate(hash, h));
    if (priorInBatch !== -1) return ids[priorInBatch];

    const match = existing.find((e) => isProbableDuplicate(hash, e.imageHash));
    return match ? match._id : null;
  });

  return { hashes, ids, duplicateOf };
}

async function uploadBatch(req, res, next) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const { hashes, ids, duplicateOf } = await detectDuplicates(files, req.userId);

    // Store the bytes first — an Item whose image is missing is the broken
    // state we're avoiding, so the image must exist before the item points at it.
    const images = await ItemImage.insertMany(
      files.map((file) => ({
        userId: req.userId,
        data: file.buffer,
        mime: file.mimetype,
      }))
    );

    const items = await Item.insertMany(
      files.map((file, index) => ({
        _id: ids[index],
        userId: req.userId,
        imageId: images[index]._id,
        imageUrl: `/api/images/${images[index]._id}`,
        status: 'pending',
        imageHash: hashes[index],
        duplicateOfItemId: duplicateOf[index],
      }))
    );

    res.status(201).json({ items });

    // Classify in the background; failures are recorded per-item, not thrown to the client.
    classifyBatchInBackground(
      items.map((item, index) => ({
        itemId: item._id,
        image: { buffer: files[index].buffer, mime: files[index].mimetype },
      }))
    );
  } catch (err) {
    next(err);
  }
}

// Classifies each item independently and concurrently, writing each result to
// the database as soon as it's ready. This means the client polling GET
// /api/items can compute real per-item progress (N of M done) instead of an
// all-or-nothing batch result, and one bad photo doesn't block the rest.
async function classifyBatchInBackground(itemsWithImages) {
  await Promise.all(
    itemsWithImages.map(async ({ itemId, image }) => {
      try {
        const result = await classifyItem(image);
        await Item.findByIdAndUpdate(itemId, { ...result, status: 'classified' });
        await clearMismatchedDuplicateFlag(itemId);
      } catch (err) {
        console.error(`Classification failed for item ${itemId}:`, err.message);
        await Item.findByIdAndUpdate(itemId, { status: 'needs_review', classificationError: err.message });
      }
    })
  );
}

/**
 * Duplicate flags are set at upload time, before classification knows what the
 * garment is. Once both items have a category, a flag linking two different
 * categories (a top vs a bottom) is provably wrong, so drop it rather than
 * asking the user about it.
 */
async function clearMismatchedDuplicateFlag(itemId) {
  const item = await Item.findById(itemId).populate('duplicateOfItemId');
  const original = item?.duplicateOfItemId;
  if (!item || !original) return;

  if (item.category && original.category && item.category !== original.category) {
    await Item.findByIdAndUpdate(itemId, { duplicateOfItemId: null });
  }
}

async function listItems(req, res, next) {
  try {
    const { category, colorFamily } = req.query;
    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (colorFamily) filter.colorFamily = colorFamily;

    // Duplicate sources are populated so the closet can show suspected pairs
    // side by side, including ones flagged before this list was opened.
    const items = await Item.find(filter).sort({ createdAt: -1 }).populate('duplicateOfItemId');
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function getItem(req, res, next) {
  try {
    // The duplicate source is populated so the client can show the suspected
    // pair side by side without a second round trip.
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId }).populate(
      'duplicateOfItemId'
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// The user reviewed a suspected duplicate and chose to keep it — clear the flag
// so it stops being surfaced as one.
async function dismissDuplicate(req, res, next) {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { duplicateOfItemId: null },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const allowedFields = [
      'category',
      'colorFamily',
      'colorHex',
      'pattern',
      'formality',
      'season',
      'sleeves',
      'neckline',
      'hemline',
      'garmentStyle',
      'fabric',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    updates.status = 'classified';

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    // Drop the bytes too, or deleted photos would accumulate in the database
    // forever with nothing referencing them.
    if (item.imageId) await ItemImage.deleteOne({ _id: item.imageId, userId: req.userId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Serves an image's bytes. Deliberately unauthenticated: the app renders these
 * with plain <Image src>, which can't attach an Authorization header. That
 * matches the old behaviour, where the same files were served as static assets
 * — an image is reachable by anyone who knows its id, so the id (a random
 * ObjectId) is the only thing protecting it. Fine for this app's content;
 * anything genuinely private would need signed URLs instead.
 */
async function getImage(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const image = await ItemImage.findById(req.params.id).lean();
    if (!image) return res.status(404).json({ error: 'Image not found' });

    // `.lean()` hands back the raw BSON value, which is a Binary rather than a
    // Node Buffer. Passing that straight to res.send() makes Express treat it
    // as an object and JSON-encode it — the image arrives base64-encoded and
    // 33% too large, and no browser can render it. Normalise to a real Buffer.
    const bytes = Buffer.isBuffer(image.data)
      ? image.data
      : Buffer.from(image.data.buffer || image.data);

    // Bytes never change for a given id, so let clients cache aggressively.
    res.set('Content-Type', image.mime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(bytes);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadBatch, listItems, getItem, getImage, updateItem, deleteItem, dismissDuplicate };
