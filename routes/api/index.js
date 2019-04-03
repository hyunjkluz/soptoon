var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth/index'));
router.use('/webtoons', require('./webtoons/index'));

module.exports = router;