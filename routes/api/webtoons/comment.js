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

//에피소드 댓글 보기
router.get('/:epIdx', async(req, res) => {
    const selectEpisodeCmtQuery = 'SELECT * FROM comment WHERE wpIdx = ? ORDER BY writetime DESC';
    const selectEpisodeCmtResult = await db.queryParam_Arr(selectEpisodeCmtQuery, [req.params.epIdx]);

    if (!selectEpisodeCmtResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.CMT_DB_SELECT_ERROR));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.COMMENT_SELECTED, selectEpisodeCmtResult));
    }
});

//에피소드 댓글 작성
router.post('/', upload.single('cmtImg'), async(req, res, next) => {
    await utils.isLoggedin(req, res, next);

    const writer = req.decoded.idx;
    const writetime = moment().format('YYYY-MM-DD hh:mm:ss');
    const content = req.body.content;
    const cmtImg = req.file.location;
    const epIdx = req.body.epIdx;

    const registCommentQuery = 'INSERT INTO comment(writer, writetime, content, cmtImg, epIdx) VALUES (?, ?, ?, ?, ?)';
    const registCommentResult = await db.queryParam_Arr(registCommentQuery, [writer, writetime, content, cmtImg, epIdx]);

    if (!registCommentResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.CMT_DB_INSERT_ERROR));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.COMMENT_CREATED));
    }
});

//에피소드 댓글 수정
router.put('/', upload.single('cmtImg'), async(req, res, next) => {
    await utils.isLoggedin(req, res, next);
    const cmtIdx = req.body.cmtIdx;
    const writetime = moment().format('YYYY-MM-DD hh:mm:ss');
    const content = req.body.content;
    const cmtImg = req.file.location;

    const findWriterQuery = 'SELECT writer FROM comment WHERE idx = ?';
    const updateCommentQuery = 'UPDATE comment SET writetime = ? AND content = ? AND cmtImg = ? WHERE idx = ?';

    const findWriterResult = await db.queryParam_Arr(findWriterQuery, [cmtIdx]);

    if (!findWriterResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.CMT_DB_SELECT_ERROR));
    } else if (findWriterResult.length == 1) {
        if (findWriterResult[0].writer == req.decoded.idx) {
            const updateCommentResult = await db.queryParam_Arr(updateCommentQuery, [writetime, content, cmtImg]);

            if (!updateCommentResult) {
                res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.CMT_DB_UPDATE_ERROR));
            } else {
                res.status(200).send(utils.successTrue(statusCode.OK, resMessage.COMMENT_UPDATED));
            }
        } else {
            res.status(200).send(utils.successFalse(statusCode.FORBIDDEN, resMessage.NO_UPDATE_AUTHORITY));
        }
    } else {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE_2));
    }
});

//에피소드 댓글 삭제
router.delete('/', utils.isLoggedin, async(req, res) => {
    const cmtIdx = req.body.cmtIdx;

    const findWriterQuery = 'SELECT writer FROM comment WHERE idx = ?';
    const deleteCmtQuery = 'DELETE FROM comment WHERE idx = ?';

    const findWriterResult = await db.queryParam_Arr(findWriterQuery, [cmtIdx]);

    if (!findWriterResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.CMT_DB_SELECT_ERROR));
    } else if (findWriterResult.length == 1) {
        if (findWriterResult[0].writer == req.decoded.idx) {
            const deleteCmtResult = await db.queryParam_Arr(deleteCmtQuery, [req.body])

            if (!deleteCmtResult) {
                res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.CMT_DB_DELETE_ERROR));
            } else {
                res.status(200).send(utils.successTrue(statusCode.OK, resMessage.COMMENT_DELETED));
            }
        } else {
            res.status(200).send(utils.successFalse(statusCode.FORBIDDEN, resMessage.NO_UPDATE_AUTHORITY));
        }
    } else {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE_2));
    }
});

module.exports = router;