const { Jimp } = require('jimp');

// Difference hash (dHash): shrink to 9x8 grayscale, then record whether each
// pixel is brighter than the one to its right. Produces a 64-bit fingerprint
// that survives resizing and recompression, so the same photo uploaded twice
// (or two near-identical shots of one garment) hashes to nearly the same value.
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

/**
 * @param {string|Buffer} source path on disk, or the image bytes themselves —
 *   uploads hash straight from memory now that images live in MongoDB.
 * @returns {Promise<string>} 64-character binary string
 */
async function computeImageHash(source) {
  const image = await Jimp.read(source);
  image.greyscale().resize({ w: HASH_WIDTH, h: HASH_HEIGHT });

  const { data, width } = image.bitmap;
  const brightnessAt = (x, y) => data[(y * width + x) * 4]; // greyscale: R === G === B

  let bits = '';
  for (let y = 0; y < HASH_HEIGHT; y++) {
    for (let x = 0; x < HASH_WIDTH - 1; x++) {
      bits += brightnessAt(x, y) > brightnessAt(x + 1, y) ? '1' : '0';
    }
  }
  return bits;
}

/**
 * Number of differing bits between two hashes. 0 means identical images;
 * small values mean visually near-identical.
 */
function hammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return distance;
}

// Chosen from the observed distance distribution over a real closet: true
// duplicates landed at 0-3, then nothing until 7, where unrelated garments
// (even across categories) start colliding. 5 sits in that empty gap.
//
// This reliably catches re-uploaded, resized, or recompressed copies of a photo.
// A garment *re-photographed* from a new angle can exceed it and slip through —
// the deliberate trade-off, since wrongly accusing unrelated items is worse than
// missing one. Raising this without re-checking the distribution will produce
// false positives.
const DUPLICATE_THRESHOLD = 5;

function isProbableDuplicate(hashA, hashB) {
  return hammingDistance(hashA, hashB) <= DUPLICATE_THRESHOLD;
}

module.exports = { computeImageHash, hammingDistance, isProbableDuplicate, DUPLICATE_THRESHOLD };
