var express = require('express');
var router = express.Router();

const crypto = require('crypto-promise');
var randtoken = require('rand-token');

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');
const jwt = require('../../../module/jwt');

router.post('/', async(req, res) => {
    let id = req.body.id;
    let name = req.body.name;
    let pw = req.body.password;

    const chkUserQuery = 'SELECT * FROM membership WHERE id = ?';
    const registUserQuery = 'INSERT INTO membership(userId, name, password, salt, refreshToken) VALUES (?, ?, ?, ?, ?)';

    if (!id || !pw || !name) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.ID_OR_PW_NULL_VALUE));
    } else {
        const chkUserResult = await db.queryParam_Arr(chkUserQuery, [id]);

        if (!checkResult) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.MEMBERSHIP_DB_SELECT_ERROR));
        } else if (chkUserResult.length >= 1) {
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.ALREADY_USER));
        } else {
            const salt = await crypto.randomBytes(32);
            const hashedPw = await crypto.pbkdf2(pw, salt.toString('base64'), 100000, 32, 'sha512');
            const refreshToken = randtoken.uid(256);

            const registUserResult = await db.queryParam_Arr(registUserQuery, [id, name, hashedPw, salt, refreshToken]);

            if (!registUserResult) {
                res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.MEMBERSHIP_DB_INSERT_ERROR))
            } else {
                res.status(200).send(utils.successTrue(statusCode.CREATED, resMessage.CREATED_USER, null));
            }
        }
    }
});


module.exports = router;