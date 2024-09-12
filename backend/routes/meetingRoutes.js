const express = require('express');
const router = express.Router();
const {  list } = require('../controllers/meetingController');

router.post('/', list);


module.exports = router;
