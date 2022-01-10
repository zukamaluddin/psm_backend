var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const {Op} = require("sequelize");

router.post('/list/:staffid',  async function (req, res) {

    // user = await db.User.findOne({
    //     where: {id : req.params.userid}
    // });
    //
    // wheres = {}
    // if (req.body.createdBy !== "") {
    //     wheres.createdBy = {[Op.like]: '%' + req.body.createdBy + '%'}
    // }

    db.Tugasan.findAndCountAll({
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

module.exports = router;