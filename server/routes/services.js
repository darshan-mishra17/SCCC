// routes/services.js
const express = require('express');
const router = express.Router();
const { getAllServices, addService } = require('../controllers/serviceController');

router.get('/', getAllServices);
router.post('/', addService);

module.exports = router;
