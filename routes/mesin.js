var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const {Op} = require("sequelize");


router.post('/list/:userid',  async function (req, res) {
    db.Mesin.findAndCountAll({
        // where: {
        //     cawangan: {
        //         [Op.like]: '%' + req.body.cawangan + '%'
        //     },
        //     ibdNo: {
        //         [Op.like]: '%' + req.body.ibdNo + '%'
        //     },
        //     status: {
        //         [Op.like]: '%' + req.body.status + '%'
        //     },
        //     rfidNo: {
        //         [Op.like]: '%' + req.body.rfidNo + '%'
        //     },

        // },
        // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        limit: req.body.pageSize,
        offset: req.body.page * req.body.pageSize,
    }).then(function (result) {
        let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: result.rows, count: totalPageNum})
    });

});

router.get('/view/:id', function (req, res) {


    db.Mesin.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            res.send({data: data})
        } else {
            res.send({status: 'FAILED', msg: 'Branch not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

router.delete('/delete', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.Mesin.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Branch deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }

});

router.post('/create', function (req, res) {
    const form = new formidable({multiples: true});

    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        console.log(data)

        db.Mesin.create({
            cawangan: data.cawangan,
            ibdNo: data.ibdNo,
            serialNo: data.serialNo,
            rfidNo: data.rfid,
            status: data.status,

        }).then(function (data) {
            res.write(JSON.stringify({status: "OK"}));
            res.end();
        });
    });

});

router.put('/update', function (req, res) {

    const form = new formidable({multiples: true});

    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);

        let mesin = await db.Mesin.findOne({where: {id: data.id}});
        if ('cawangan' in data) {
            mesin.cawangan = data.cawangan;
        }
        if ('ibdNo' in data) {
            mesin.ibdNo = data.ibdNo;
        }
        if ('rfidNo' in data) {
            mesin.rfidNo = data.rfidNo;
        }
        if ('serialNo' in data) {
            mesin.serialNo = data.serialNo;
        }
        if ('status' in data) {
            mesin.status = data.status;
        }

        await mesin.save();


        res.write(JSON.stringify({status: "OK"}));
        res.end();
    });
});

router.get('/get-all-branches/:cawangan', async function (req, res) {
    getCawangan = req.params.cawangan;
    db.Mesin.findAll(
        {where: {cawangan: getCawangan}}
    ).then(function (result) {

        let arrResult = []
        for (const data of result) {
            let obj = {}
            obj['id'] = data.id
            obj['ibdNo'] = data.ibdNo
            arrResult.push(obj)
        } 
        console.log(arrResult)
        res.send({data: arrResult})
    });
    
});

router.get('/get-current/:ibdId', async function (req, res) {
    getibdId = req.params.ibdId;
    db.Mesin.findOne(
        {where: {ibdId: getCawangan}}
    ).then(function (result) {

        let arrResult = []
        for (const data of result) {
            let obj = {}
            obj['id'] = data.id
            obj['ibdNo'] = data.ibdNo
            arrResult.push(obj)
        } 
        console.log(arrResult)
        res.send({data: arrResult})
    });
    
});
// router.get('/check_branch/:code/:userid', auditTrail.trace, async function (req, res) {
//     let branch = await db.Branch.findOne({where: {code: req.params.code}});

//     if (branch) {
//         res.send({exist: true})
//     } else {
//         res.send({exist: false})
//     }
// });


module.exports = router;
