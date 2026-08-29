// Backfills `imageHash` for items uploaded before duplicate detection existed,
// then reports (without changing) any groups of existing items that look alike.
//
//   node scripts/backfillImageHashes.js          # backfill + report duplicates
//   node scripts/backfillImageHashes.js --flag   # also set duplicateOfItemId on the copies
//
// Nothing is ever deleted; --flag only marks copies so the app can surface them.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Item = require('../src/models/Item');
const { computeImageHash, isProbableDuplicate } = require('../src/services/imageHash');

const shouldFlag = process.argv.includes('--flag');
const uploadPath = (imageUrl) => path.join(__dirname, '..', 'uploads', path.basename(imageUrl));

async function backfill() {
  const missing = await Item.find({ $or: [{ imageHash: null }, { imageHash: { $exists: false } }] });
  console.log(`Items missing a hash: ${missing.length}`);

  let hashed = 0;
  let skipped = 0;

  for (const item of missing) {
    const file = uploadPath(item.imageUrl);
    if (!fs.existsSync(file)) {
      console.warn(`  skip ${item._id} — image file not found (${path.basename(file)})`);
      skipped++;
      continue;
    }
    try {
      item.imageHash = await computeImageHash(file);
      await item.save();
      hashed++;
    } catch (err) {
      console.warn(`  skip ${item._id} — could not hash: ${err.message}`);
      skipped++;
    }
  }

  console.log(`Hashed: ${hashed}, skipped: ${skipped}`);
}

async function reportDuplicates() {
  const items = await Item.find({ imageHash: { $ne: null } })
    .sort({ createdAt: 1 })
    .select('_id imageHash imageUrl category colorFamily createdAt');

  // First item of each look-alike group is treated as the original; later ones
  // are the copies, matching how live uploads resolve duplicates.
  // Items in different categories are never duplicates of each other, however
  // close their hashes happen to land.
  const couldMatch = (a, b) =>
    isProbableDuplicate(a.imageHash, b.imageHash) &&
    (!a.category || !b.category || a.category === b.category);

  const groups = [];
  for (const item of items) {
    const group = groups.find((g) => couldMatch(g.original, item));
    if (group) group.copies.push(item);
    else groups.push({ original: item, copies: [] });
  }

  const dupGroups = groups.filter((g) => g.copies.length > 0);
  if (dupGroups.length === 0) {
    console.log('\nNo look-alike items found among existing closet items.');
    return;
  }

  console.log(`\nFound ${dupGroups.length} group(s) of look-alike items:`);
  for (const { original, copies } of dupGroups) {
    console.log(`\n  original: ${original._id}  ${original.category}/${original.colorFamily}  ${path.basename(original.imageUrl)}`);
    for (const copy of copies) {
      console.log(`    copy:   ${copy._id}  ${copy.category}/${copy.colorFamily}  ${path.basename(copy.imageUrl)}`);
      if (shouldFlag) {
        await Item.findByIdAndUpdate(copy._id, { duplicateOfItemId: original._id });
      }
    }
  }

  console.log(
    shouldFlag
      ? '\nCopies flagged with duplicateOfItemId. Nothing was deleted.'
      : '\nRe-run with --flag to mark these copies as duplicates (still nothing deleted).'
  );
}

(async () => {
  await connectDB();
  await backfill();
  await reportDuplicates();
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
