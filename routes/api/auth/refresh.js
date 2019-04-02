var express = require('express');
var router = express.Router();

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');
const jwt = require('../../../module/jwt');

router.put('/', utils.isLoggedin, async(req, res) => {
    const refreshToken = req.body.refreshToken;

    const findUserQuery = 'SELECT * FROM membership where idx = ? AND name = ?';

    if (!refreshToken) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.EMPTY_REFRESH_TOKEN));
    } else {
        const findUserResult = await db.queryParam_Arr(findUserQuery, [req.decoded.idx, req.decoded.name]);

        if (!findUserResult) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.MEMBERSHIP_DB_SELECT_ERROR));
        } else {
            const newToken = jwt.sign(findUserResult[0]);
            res.status(200).send(utils.successTrue(statusCode.OK, resMessage.REFRESH_TOKEN, newToken));
        }
    }
});

module.exports = router;