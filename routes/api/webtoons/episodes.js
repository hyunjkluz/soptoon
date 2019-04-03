var express = require('express');
var router = express.Router();

const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');
const upload = require('../../../config/multer');

//웹툰의 전체 에피소드 보여줌
router.get('/list/:wtIdx', async(req, res) => {
    const wtIdx = parseInt(req.params.wtIdx);

    const getWebToonQuery = 'SELECT title, likes FROM webtoon WHERE idx = ?';
    const getEpisodeListQuery = 'SELECT * FROM episode WHERE wtIdx = ? ORDER BY chapter DESC';

    const getWebToonResult = await db.queryParam_Arr(getWebToonQuery, [wtIdx]);
    const getEpisodeListResult = await db.queryParam_Arr(getEpisodeListQuery, [wtIdx]);

    if (!getWebToonResult || !getEpisodeListResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.EP_DB_SELECT_ERROR));
    } else if (getEpisodeListResult.length == 0) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
    } else {
        const result = {
            webtoonInfo: getWebToonResult,
            list: getEpisodeListResult
        }
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.EPISODE_SELECTED, result));
    }
});

//특정 회차 에피소드 보여줌
router.get('/:epIdx', async(req, res) => {
    const epIdx = parseInt(req.params.epIdx);

    const selectEpisodeQuery = 'SELECT chapter, title FROM episode WHERE idx = ?';
    const selectEpImgQuery = 'SELECT epImg FROM episodeImgs WHERE epIdx = ? ORDER BY depth';
    const updateEpHitsQuery = 'UPDATE episode SET hits = hits + 1 WHERE idx = ?';

    const selectEpisodeResult = await db.queryParam_Arr(selectEpisodeQuery, [epIdx]);
    const selectEpImgResult = await db.queryParam_Arr(selectEpImgQuery, [epIdx]);

    if (!selectEpisodeResult || !selectEpImgResult) {
        res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.EP_DB_SELECT_ERROR));
    } else {
        const updateEpHitsResult = await db.queryParam_Arr(updateEpHitsQuery, [epIdx]);

        const result = {
            epInfo: selectEpisodeResult,
            imgs: selectEpImgResult
        }
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.EPISODE_SELECTED, result));
    }
});

//에피소드 등록
router.post('/', upload.array('epImgs'), async(req, res) => {
    const wtIdx = req.body.wtIdx;
    const title = req.body.title;
    const epImgs = req.files;

    const registEpQuery = 'INSERT INTO episode(chapter, title, thumnail, hits, wtIdx) ' +
        'VALUES ((SELECT chapter FROM episode WHERE wtIdx = ? ORDER BY chapter DESC limit 1) + 1, ?, ?, 0, ?)';
    const registEpImgQuery = 'INSERT INTO episodeImgs(epImg, depth, epIdx) VALUES (?, ?, ?)';

    if (req.files.length !== 0) {
        const registEpTranscation = await db.Transaction(async(connection) => {
            const registEpResult = await connection.query(registEpQuery, [wtIdx, title, epImgs[0].location, wtIdx]);
            const epIdx = registEpResult.insertIdx;

            for (let i = 1; i < epImgs.length; i++) {
                const registEpImgResult = await connection.query(registEpImgQuery, [epImgs[i].location, 1, epIdx]);
            }
        });

        if (!registEpTranscation) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.EP_DB_INSERT_ERROR));
        } else {
            res.status(200).send(utils.successTrue(statusCode.CREATED, resMessage.EPISODE_CREATED));
        }
    } else {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    }
});

//에피소드 삭제
router.delete('/', utils.isLoggedin, async(req, res) => {
    if (req.decoded.grade != 3) {
        res.status(200).send(utils.successFalse(statusCode.FORBIDDEN, resMessage.NO_DELETE_AUTHORITY));
    } else {
        const epIdx = req.body.epIdx;

        const deleteEpisodeQuery = 'DELETE FROM episode WHERE idx = ?';
        const deleteEpisodeResult = await db.queryParam_Arr(deleteEpisodeQuery, [epIdx]);

        if (!deleteEpisodeResult) {
            res.status(200).send(utils.successFalse(statusCode.DB_ERROR, resMessage.EP_DB_DELETE_ERROR));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, resMessage.EPISODE_DELETED));
        }
    }
});


module.exports = router;