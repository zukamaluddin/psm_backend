var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const {Op} = require("sequelize");
const e = require('express');

router.post('/add_lantikan',  async function (req, res) {

    const form = new formidable({multiples: true});
    let result = {};

    form.parse(req, async function (err, fields, files) {

        console.log(fields.staffId)

        let lantikan_id_exist = "";

        lantikan_id_exist = await db.Lantikan.create({
            title: fields.title,
            staffName: fields.staffName,
            staffId: fields.staffId,
            dateAssigned: dateNow,
            dateStart: fields.dateStart,
            dateEnd: fields.dateEnd,
            jawatanPentadbiran: fields.jawatanPentadbiran,
            jawatanGenerik: fields.jawatanGenerik,
            description: fields.description,
            updatedBy: fields.staffId,
            createdBy: fields.staffId,
        })

        await lantikan_id_exist.save();
        res.send(JSON.stringify({status: "OK"}));
    });

});

router.delete('/delete/:lantikanid', async function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        let lantikan = await db.Lantikan.findAll({
            where: {
                id: {
                    [Op.in]: data
                },
            }
        });

        lantikan.forEach(function (lantikan, index, arr) {
            lantikan.status = 0;
            lantikan.save();
        });

        res.send({status: 'OK', msg: 'Lantikan deleted'})
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }

});

module.exports = router;