var express = require('express');
var router = express.Router();

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');

//웹툰 좋아요 등록 및 취소
router.post('/', utils.isLoggedin, async(req, res) => {
    const liker = req.decoded.idx;
    const wtIdx = req.body.wtIdx;
    let queryOperator = '+';

    const findLikeQuery = 'SELECT * FROM like WHERE liker = ? AND wtIdx = ?';
    const registLikeQuery = 'INSERT INTO like(writer, wtIdx) VALUES (?, ?)';
    const deleteLikeQuery = 'DELETE FROM like WHERE liker = ? AND wtIdx = ?';
    let updateLikesQuery = `UPDATE webtoon SET likes = likes ${queryOperator} 1 WHERE idx = ?`;

    const findLikeResult = await db.queryParam_Arr(findLikeQuery, [liker, wtIdx]);

    if (!findLikeResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.LIKE_DB_SELECT_ERROR));
    } else if (findLikeResult.length == 1) { //좋아요가 존재하므로 좋아요 취소
        queryOperator = '-';
        const deleteLikeTransaction = await db.Transaction(async(connection) => {
            const deleteLikeResult = await connection.query(deleteLikeQuery, [liker, wtIdx]);
            const updateLikesQuery = await connection.query(updateLikesQuery, [wtIdx]);
        });

        if (!deleteLikeTransaction) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.LIKE_DB_DELETE_ERROR));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, resMessage.LIKE_DELETED));
        }
    } else {
        const registLikeTransaction = await db.Transaction(async(connection) => {
            const regisLikeResult = await connection.query(registLikeQuery, [liker, wtIdx]);
            const updateLikesQuery = await connection.query(updateLikesQuery, [wtIdx]);
        });

        if (!registLikeTransaction) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.LIKE_DB_INSERT_ERROR));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, resMessage.LIKE_CREATED));
        }
    }
});


module.exports = router;