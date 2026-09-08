const mongoose = require('mongoose');

// Image bytes live in their own collection rather than on the Item, because
// every closet listing loads the full Item documents — embedding a few hundred
// KB of binary in each would turn `GET /api/items` into a multi-megabyte
// response. Kept separate, an item stays small and the bytes are fetched only
// when a specific image is requested.
//
// This replaces local-disk storage: the host's filesystem is wiped on every
// restart, so uploaded photos vanished while the Item rows survived, leaving
// broken thumbnails. Images now persist exactly as reliably as the rest of the
// data. The trade-off is database size — fine at closet scale (a few hundred
// KB per photo), but object storage is the right answer if this ever grows.
const itemImageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    data: { type: Buffer, required: true },
    mime: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItemImage', itemImageSchema);
