var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
var moment = require("moment");
var auditTrail = require('../middleware/auditTraill/index.js');
let formidable = require('formidable');
const {Op} = require("sequelize");
const {v4: uuidv4} = require('uuid');
var authJWT = require("../middleware/auth/index.js")

// router.use(authJWT.verifyToken);

router.post('/list_category/:userid', auditTrail.trace, async function (request, response) {
    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {
        let token = request.query
        if (err) throw err
        let body = JSON.parse(fields.data);
        let whereS = [];

        // if (Object.entries(body.harga).length > 0) {
        //     whereS.harga = {
        //         [Op.like]: '%' + body.harga + '%'
        //     }
        // }
        //
        // if (Object.entries(body.noRocRob).length > 0) {
        //     whereS.noRocRob = {
        //         [Op.like]: '%' + body.noRocRob + '%'
        //     }
        // }
        //
        // if (Object.entries(body.agency).length > 0) {
        //     if (body.agency !== 'All') {
        //         whereS.agency = body.agency
        //     }
        //
        // }
        // if (Object.entries(body.address).length > 0) {
        //     if (body.address !== 'All') {
        //         whereS.address = {
        //             // [Op.like]: '%Maintenance%'
        //             [Op.like]: '%' + body.address + '%'
        //         }
        //     }
        // }

        let sorted = [];
        if (body.sorted.length > 0) {
            // if (body.sorted[0]['id'] === "name") {
            //     sorted.push(["name", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            // }
            // if (body.sorted[0]['id'] === "noRocRob") {
            //     sorted.push(["noRocRob", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            // }
            // if (body.sorted[0]['id'] === "agency") {
            //     sorted.push(["agency", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            // }
            // if (body.sorted[0]['id'] === "state") {
            //     sorted.push(["state", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            // }
            //
            // if (body.sorted[0]['id'] === "date_created") {
            //     sorted.push(["date_created", (body.sorted[0]['date_created'] ? 'ASC' : 'DESC')])
            // }

        } else {
            sorted.push(["name", 'ASC'])
        }

        db.Kategori.findAndCountAll({
            include: [
                {model: db.Lain, as :'lain', include: [{
                    model: db.Jenis, as: 'jenis'
                }]
            }],
            where: whereS,
            order: sorted,
            limit: body.pageSize,
            offset: body.page * body.pageSize,
            raw: true

        }).then(async function (data) {
        // console.log(data);
        let dataArr = [];
        if (data.count > 0) {
            // console.log('--------------------------------------------------------------------------------------------------------')


            let prom1 = await new Promise(function (resolve1, reject1) {

                data.rows.forEach(async function (v, w) {
                //

                    // console.log(v)

                    let lain = await db.Lain.findOne({
                        where: {id: v.lain_id},
                    });
                    let jenis = await db.Jenis.findOne({
                        where: {id: lain.jenis_id},
                    });

                    obj = {};
                    obj['id'] = v.id;
                    obj['jenis'] = jenis.name;
                    obj['kategori'] = v.name;
                    obj['kegunaan'] = jenis.kegunaan;
                    obj['lain'] = lain.name;
                    obj['harga'] = v.harga;
                    // console.log(obj)

                    dataArr.push(obj);

                //
                    if (w === data.rows.length - 1) {
                        response.send({status: 'OK', data: dataArr, count: Math.ceil(data.count / body.pageSize)})
                    }
                });
            });

            return prom1;
        } else {
            return {status: 'OK', data: dataArr, count: Math.ceil(data.count / body.pageSize)}
        }


    }).catch(function (err) {
        // console.log(err);
        response.send({status: 'FAILED', data: [], count: 1})
    });

        // (results => {
        //
        //     console.log(results)
        //     response.send({status: 'OK', data: results.rows, count: Math.ceil(results.count / body.pageSize)})
        // }).catch(function (err) {
        //     console.log(err)
        //     response.end(JSON.stringify({status: "ERROR"}));
        // });
    })
});



module.exports = router;
