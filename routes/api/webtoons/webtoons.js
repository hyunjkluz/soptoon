var express = require('express');
var router = express.Router();

const moment = require('moment');
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');
const upload = require('../../../config/multer');

//웹툰 등록
router.post('/', upload.single("wtThum"), async(req, res, next) => {
    await utils.isLoggedin(req, res, next);
    const title = req.body.title;
    const wtThum = req.file.location;
    const registDate = moment().format('YYYY-MM-DD hh:mm:ss');

    const registWebToonQuery = 'INSERT INTO webtoon(title, author, thumnail, registDate, likes, isFinished) VALUES (?, ?, ?, ?, ?, ?)';

    if (!title || !wtThum) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        if (req.decoded.grade != 3) {
            res.status(200).send(utils.successFalse(statusCode.FORBIDDEN, resMessage.NO_CREATE_AUTHORITY));
        } else {
            const registWebToonResult = await db.queryParam_Arr(registWebToonQuery, [title, req.decoded.idx, wtThum, registDate, 0, 0]);

            if (!registWebToonResult) {
                res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.WT_DB_INSERT_ERROR));
            } else {
                res.status(200).send(utils.successTrue(statusCode.CREATED, resMessage.WEBTOON_CREATED));
            }
        }
    }
});

//웹툰 삭제
router.delete('/', utils.isLoggedin, async(req, res) => {
    const wtIdx = req.body.wtIdx;

    const deleteWebToonQuery = 'DELETE FROM webtoon WHERE idx = ?';

    if (wtIdx === null) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        if (req.decoded.grade != 3) { //관리자가 아닐 때 (일반회원일 때 )
            res.status(200).send(utils.successFalse(statusCode.FORBIDDEN, resMessage.NO_DELETE_AUTHORITY));
        } else {
            const deleteWebToonResult = await db.queryParam_Arr(deleteWebToonResult, [wtIdx]);

            if (!deleteWebToonResult) {
                res.status(200), send(utils.successFalse(statusCode.DB_ERROR, resMessage.WT_DB_DELETE_ERROR));
            } else {
                res.status(200).send(utils.successTrue(statusCode.OK, resMessage.WEBTOON_DELETED));
            }
        }
    }
});

module.exports = router;