const express = require('express');
const router = express.Router();

const {
  getContent,
  getRecommended,
  getContentById,
  createContent,
  seedContent,
} = require('../controllers/contentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Routes
router.get('/recommended', getRecommended);
router.post('/seed', seedContent);

router.route('/')
  .get(getContent)
  .post(createContent);

router.route('/:id')
  .get(getContentById);

module.exports = router;

