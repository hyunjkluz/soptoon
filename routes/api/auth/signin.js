var express = require('express');
var router = express.Router();

const crypto = require('crypto-promise');

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');
const jwt = require('../../../module/jwt');

router.post('/', async(req, res) => {
    const id = req.body.id;
    const pw = req.body.password;

    const chkUserQuery = 'SELECT * FROM membership WHERE id = ?';

    if (!id || !pw) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.ID_OR_PW_NULL_VALUE));
    } else {
        const chkUserResult = await db.queryParam_Arr(chkUserQuery, [id]);

        if (!chkUserResult) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.MEMBERSHIP_DB_SELECT_ERROR));
        } else if (chkUserResult.length == 1) {
            const hashedPw = await crypto.pbkdf2(pw, chkUserResult[0].salt.toString('base64'), 100000, 32, 'sha512');

            if (chkUserResult[0].pw == hashedPw) {
                const token = jwt.sign(chkUserResult);
                res.status(200).send(utils.successTrue(statusCode.CREATED, resMessage.CREATED_USER, token));
            } else {
                res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.MISS_MATCH_PW));
            }
        } else {
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NO_USER));
        }
    }
});

module.exports = router;