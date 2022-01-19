var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
var moment = require('moment');
let formidable = require('formidable');
const {Op} = require("sequelize");

router.post('/list/:staffid', async function (req, res) {

    // user = await db.User.findOne({
    //     where: {id : req.params.userid}
    // });
    //
    // wheres = {}
    // if (req.body.createdBy !== "") {
    //     wheres.createdBy = {[Op.like]: '%' + req.body.createdBy + '%'}
    // }

    db.Tugasan.findAndCountAll({
        where: {createdBy: req.params.staffid}
        // where: wheres
        // ,
        // // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        // limit: req.body.pageSize,
        // offset: req.body.page * req.body.pageSize,
    }).then(function (result) {
        // let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: result.rows, count: '1'})
    });
});

router.post('/create', function (req, res) {
    const form = new formidable({multiples: true});

    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        console.log(data)

        db.Tugasan.create({
            title: data.title,
            dateStart: data.dateStart,
            dateEnd: data.dateEnd,
            description: data.description,
            status: data.status,
            report: data.report,
            createdBy: data.createdBy,

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

        let tugasan = await db.Tugasan.findOne({where: {id: data.id}});
        if ('status' in data) {
            tugasan.status = data.status;
        }
        if ('report' in data) {
            tugasan.report = data.report;
        }
        if ('title' in data) {
            tugasan.title = data.title;
        }
        if ('description' in data) {
            tugasan.description = data.description;
        }
        if ('dateStart' in data) {
            tugasan.dateStart = data.dateStart;
        }
        if ('dateEnd' in data) {
            tugasan.dateEnd = data.dateEnd;
        }

        await tugasan.save();
        res.write(JSON.stringify({status: "OK"}));
        res.end();
    });
});

router.delete('/delete', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.Tugasan.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Tugasan deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }

});

router.get('/view/:id', function (req, res) {
    db.Tugasan.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            res.send({data: data})
        } else {
            res.send({status: 'FAILED', msg: 'Task not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

router.get('/dashboard/:id', function (req, res) {
    db.Tugasan.findAndCountAll({
        where: {createdBy: req.params.id},
    },).then(async function (data) {
        if (data) {
            var total = {
                "Baru": 0, "Batal": 0, "Dalam Progres": 0, "Lebih Masa": 0, "Selesai": 0, byBulan: {
                    "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0,
                    "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0,
                }
            }
            const d = new Date();
            let year = d.getFullYear();
            data.rows.map((i, idx) => {
                var splitDate = i.dateStart.split("/")
                if (parseInt(splitDate[2]) == year) {
                    if (i.status == "Baru") {
                        total["Baru"] += 1

                    } else if (i.status == "Batal") {
                        total["Batal"] += 1
                    } else if (i.status == "Dalam Progres") {
                        total["Dalam Progres"] += 1
                    } else if (i.status == "Lebih Masa") {
                        total["Lebih Masa"] += 1
                    } else if (i.status == "Selesai") {
                        total["Selesai"] += 1
                        var month = i.dateStart.split("/")
                        var bulan = moment().month(parseInt(month[1]) - 1).format("MMM")
                        total.byBulan[bulan] += 1
                    }

                }

            })

            res.send({data: total})
        } else {
            res.send({status: 'FAILED', msg: 'Task not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

module.exports = router;