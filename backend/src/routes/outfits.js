const express = require('express');
const {
  generateOutfit,
  listOutfits,
  getOutfit,
  listSavedOutfits,
  saveOutfit,
  unsaveOutfit,
  updateOutfitOccasion,
} = require('../controllers/outfitsController');

const router = express.Router();

router.post('/generate', generateOutfit);
// Declared before '/:id' so "saved" isn't parsed as an outfit id.
router.get('/saved', listSavedOutfits);
router.get('/', listOutfits);
router.get('/:id', getOutfit);
router.patch('/:id', updateOutfitOccasion);
router.post('/:id/save', saveOutfit);
router.post('/:id/unsave', unsaveOutfit);

module.exports = router;
