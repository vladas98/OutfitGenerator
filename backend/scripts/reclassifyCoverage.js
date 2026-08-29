// Re-runs classification on items missing the coverage attributes (sleeves,
// neckline, hemline, garmentStyle) that the occasion rules depend on. Items
// classified before those fields existed have them undefined, which the filters
// let through — so Work would happily suggest a sleeveless top until this runs.
//
//   node scripts/reclassifyCoverage.js            # preview what would change
//   node scripts/reclassifyCoverage.js --apply    # actually re-classify
//
// Only the coverage fields are written; existing category/color/formality
// choices (which the user may have corrected by hand) are left alone.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Item = require('../src/models/Item');
const { classifyItem } = require('../src/services/aiService');

const apply = process.argv.includes('--apply');
const COVERAGE_FIELDS = ['sleeves', 'neckline', 'hemline', 'garmentStyle', 'fabric'];
const uploadPath = (imageUrl) => path.join(__dirname, '..', 'uploads', path.basename(imageUrl));

(async () => {
  await connectDB();

  const needing = await Item.find({
    status: 'classified',
    $or: COVERAGE_FIELDS.map((f) => ({ [f]: { $in: [null, undefined] } })),
  });

  console.log(`Items missing coverage attributes: ${needing.length}`);
  if (!apply) {
    console.log('\nPreview only — re-run with --apply to classify them.');
    needing.slice(0, 10).forEach((i) => console.log(`  ${i._id}  ${i.category}/${i.colorFamily}`));
    if (needing.length > 10) console.log(`  …and ${needing.length - 10} more`);
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let failed = 0;

  // Sequential on purpose: this hits the vision API once per item, and a whole
  // closet at once would risk rate limits for no real speed benefit.
  for (const item of needing) {
    const file = uploadPath(item.imageUrl);
    if (!fs.existsSync(file)) {
      console.warn(`  skip ${item._id} — image file missing`);
      failed++;
      continue;
    }
    try {
      const result = await classifyItem(file);
      const updates = {};
      for (const field of COVERAGE_FIELDS) {
        if (result[field]) updates[field] = result[field];
      }
      await Item.findByIdAndUpdate(item._id, updates, { runValidators: true });
      updated++;
      console.log(
        `  ${item.category}/${item.colorFamily} -> ` +
          COVERAGE_FIELDS.map((f) => `${f}=${updates[f] || '-'}`).join(' ')
      );
    } catch (err) {
      console.warn(`  failed ${item._id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nUpdated: ${updated}, failed: ${failed}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
