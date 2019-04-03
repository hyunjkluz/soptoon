var express = require('express');
var router = express.Router();

router.use('/main', require('./main'));
router.use('/episodes', require('./episodes'));
router.use('/', require('./webtoons'));

module.exports = router;