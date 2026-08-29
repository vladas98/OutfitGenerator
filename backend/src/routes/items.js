const express = require('express');
const upload = require('../middleware/upload');
const {
  uploadBatch,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  dismissDuplicate,
} = require('../controllers/itemsController');

const router = express.Router();

router.post('/batch', upload.array('images', 20), uploadBatch);
router.get('/', listItems);
router.get('/:id', getItem);
router.patch('/:id', updateItem);
router.post('/:id/dismiss-duplicate', dismissDuplicate);
router.delete('/:id', deleteItem);

module.exports = router;
