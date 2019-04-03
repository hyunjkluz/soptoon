var express = require('express');
var router = express.Router();

router.use('/main', require('./main'));
router.use('/episodes/cmts', require('./comment'));
router.use('/episodes', require('./episodes'));
router.use('/likes', require('./likes'));
router.use('/', require('./webtoons'));

module.exports = router;