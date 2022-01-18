var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const {Op} = require("sequelize");
const e = require('express');

router.post('/getUser',  async function (req, res) {
    db.User.findAndCountAll({
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

router.post('/listLantikan',  async function (req, res) {
    db.Lantikan.findAndCountAll({
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

router.post('/add_lantikan',  async function (req, res) {
    const form = new formidable({multiples: true});
    let result = {};
    form.parse(req, async function (err, fields, files) {
        let lantikan_id_exist = "";
        let data = JSON.parse(fields.data);
        console.log(data.staffName)
        lantikan_id_exist = await db.Lantikan.create({
            staffName: data.staffName,
            staffId: data.staffId,
            dateAssigned: data.dateAssigned,
            dateStart: data.dateStart,
            dateEnd: data.dateEnd,
            jawatanPentadbiran: data.jawatanPentadbiran,
            jawatanGred: data.jawatanGred,
            jawatanLantikan: data.jawatanLantikan,
            jawatanGenerik: data.jawatanGenerik,
            description: data.description,
            referenceNo: data.referenceNo,
            dateLetterLantikan: data.dateLetterLantikan,
            updatedBy: data.staffId,
            createdBy: data.staffId,
            isDeleted: 0,
        })
        await lantikan_id_exist.save();
        res.send(JSON.stringify({status: "OK"}));
    });
});

router.delete('/delete', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.Lantikan.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Lantikan deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }

});

router.get('/view/:id', function (req, res) {
    db.Lantikan.findOne({
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