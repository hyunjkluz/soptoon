var express = require('express');
var router = express.Router();

const cron = require('node-cron');
const moment = require('moment');
const fileSys = require('fs');

const utils = require('../../../module/utils/utils');
const resMessage = require('../../../module/utils/responseMessage');
const statusCode = require('../../../module/utils/statusCode');
const db = require('../../../module/pool');

//웹툰 메인화면
router.get('/:flag', async(req, res) => {
    const flag = req.params.flag;
    let resultData;
    try {
        if (flag == 1) { //인기
            resultData = JSON.parse(fileSys.readFileSync('popularResult.txt', 'UTF-8'));
        } else if (flag == 2) { //신작
            resultData = JSON.parse(fileSys.readFileSync('newResult.txt', 'UTF-8'));
        } else if (flag == 3) { //완결
            resultData = JSON.parse(fileSys.readFileSync('finishedResult.txt', 'UTF-8'));
        } else {
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.OUT_OF_VALUE));
        }

        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.WEBTOON_SELECTED, resultData));
    } catch (readFileSysError) {
        res.status(200).send(authUtil.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.WEBTOON_RESULT_FILESYS_ERROR));
    }

});

//10분마다 인기 순위 반영
cron.schedule('*/10 * * * *', async() => {
    const selectPopularWebToonQuery = 'SELECT * ' +
        'FROM webtoon AS wt JOIN membership AS ms ON wt.author = ms.idx ' +
        'WHERE wt.isFinished = 0 ORDER BY wt.likes DESC';

    const selectPopularWebToonResult = await db.queryParam_None(selectPopularWebToonQuery);

    if (!selectPopularWebToonResult) {
        console.log("popular webtoon file save error");
    } else {
        try {
            fileSys.writeFileSync('popularResult.txt', JSON.stringify(selectPopularWebToonResult), 'UTF-8');
        } catch (resultError) {
            console.log(resultError);
        }
    }
});

//매일 12시마다 신작과 완결 결과 빌드
cron.schedule('0 0 12 * * *', async() => {
    const selectNewWebToonQuery = 'SELECT * ' +
        'FROM webtoon AS wt JOIN membership AS ms ON wt.author = ms.idx ' +
        'WHERE wt.isFinished = 0 AND (date(wt.registDate) >= date(subdate(now(), INTERVAL 7 DAY)) AND date(wt.registDate) <= date(now())) ' +
        'ORDER BY wt.registDate';
    const selectFinishedWebToonQuery = 'SELECT * ' +
        'FROM webtoon AS wt JOIN membership AS ms ON wt.author = ms.idx ' +
        'WHERE wt.isFinished = 1 ORDER BY wt.registDate';

    const selectNewWebToonResult = await db.queryParam_None(selectNewWebToonQuery);
    const selectFinishedWebToonResult = await db.queryParam_None(selectFinishedWebToonQuery);

    if (!selectNewWebToonResult || !selectFinishedWebToonResult) {
        console.log("webtoon main file save error");
    } else {
        try {
            fileSys.writeFileSync('newResult.txt', JSON.stringify(selectNewWebToonResult), 'UTF-8');
            fileSys.writeFileSync('finishedResult.txt', JSON.stringify(selectFinishedWebToonResult), 'UTF-8');
        } catch (resultError) {
            console.log(resultError);
        }
    }
});

module.exports = router;