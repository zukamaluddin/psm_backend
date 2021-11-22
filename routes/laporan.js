var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const {Op} = require("sequelize");
const e = require('express');

router.get('/get_ibd/:ibdId',  async function (req, res) {
    processList = ["Intake Start", "Intake End", "Blower /CHF start", "Blower / CHF End", "Record Temperature", "Sack-Off Start", "Sack-End"]
    const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
    dateNow = new Date();
    monthNo = dateNow.getMonth();
    monthNow = monthNames[dateNow.getMonth()];
    yearNow = dateNow.getFullYear();

    mesinExist = await db.Mesin.findOne({
        where : { id : req.params.ibdId}
    })

    let result = {};

    if (mesinExist) {
        
        laporanExist = await db.Laporan.findOne({
            where : { month: monthNow, year: yearNow, isdeleted : false, 
                isFinish: false, mesin_id: mesinExist.id,
                cawangan: mesinExist.cawangan }
        })
    
        if (laporanExist) { 

            var noIndex = processList.indexOf(laporanExist.processName);

            result['status'] = "OK"
            result["processName"] = processList[noIndex + 1]
            result["batchNo"] = laporanExist.batchNo
        }else{
            laporanCount = await db.Laporan.count({
                where: { month: monthNow, year: yearNow, isdeleted : false, 
                    isFinish: true, mesin_id: mesinExist.id,
                    cawangan: mesinExist.cawangan}
            })

            if(laporanCount == 0){
                result["batchNo"] =  (monthNo >= 10) ? monthNo : 0 + monthNo.toString() + "/" + yearNow + "/"+ "01" + "/" + mesinExist.ibdNo
            }else{

                if((parseInt(laporanCount) + 1).toString().length >= 1){
                    vounts = "0" + (parseInt(laporanCount) + 1).toString()
                }else{
                    vounts = (parseInt(laporanCount) + 1).toString()
                }
                result["batchNo"] =  (monthNo >= 10) ? monthNo : 0 + monthNo.toString() + "/" + yearNow + "/"+ vounts + "/" + mesinExist.ibdNo
            }

            result['status'] = "OK"
            result["processName"] = "Intake Start"
            
        }

        
    }else{
        result['status'] = "Failed"
    }

    res.send(result);
});


router.get('/get_details/:laporanID',  async function (req, res) {
    laporan = await db.Laporan.findOne({
        where: {id : req.params.laporanID}
    }).then(async function (result) {
        await db.Process.findAll({
            where: {laporan_id : req.params.laporanID},
            order: [['date_created', 'ASC']]
        }).then(function (result1) {
            res.send({data: [result], data1: result1, count: 0})
        })
    });
});


router.post('/add_lopran',  async function (req, res) {

    const form = new formidable({multiples: true});
    let result = {};

    const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
    dateNow = new Date();
    monthNo = dateNow.getMonth();
    monthNow = monthNames[dateNow.getMonth()];
    yearNow = dateNow.getFullYear();

    form.parse(req, async function (err, fields, files) {

        console.log(fields.staffId)

        let laporan_id_exist = "";
        if(fields.processName == "Intake Start"){
            laporan_id_exist = await db.Laporan.create({
                month: monthNow,
                year: yearNow,
                batchNo: fields.IBDNo,
                processName: fields.processName,
                cawangan: fields.cawangan,
                mesin_id: fields.ibdId,
                created_by: fields.staffId
            })
        }else{

            laporan_id_exist = await db.Laporan.findOne({
                where : {

                    batchNo: fields.IBDNo,
                    cawangan: fields.cawangan,
                    mesin_id: fields.ibdId,
                    
                }
            })

            laporan_id_exist.processName = fields.processName
        }

        if(fields.processName == "Sack-End")
            laporan_id_exist.isFinish = true

        await db.Process.create({
            processName: fields.processName,
            suhu: fields.suhu,
            depan: fields.depan,
            tengah: fields.tengah,
            belakang: fields.belakang,
            date_captured: fields.dateCapture,
            created_by: fields.staffId,
            laporan_id: laporan_id_exist.dataValues.id
        })

        await laporan_id_exist.save();

        // db.Laporan.create({
        //     month: monthNow,
        //     year: yearNow,
        //     batchNo: fields.IBDNo,
        //     processName: fields.processName,
        //     cawangan: fields.cawangan,
        //     mesin_id: fields.ibdId,
        //     created_by: fields.staffId
        // }).then(function (data) {
        //     console.log(data);


            // db.Process.create({
            //     processName: fields.processName,
            //     suhu: fields.suhu,
            //     depan: fields.depan,
            //     tengah: fields.tengah,
            //     belakang: fields.belakang,
            //     date_captured: fields.dateCapture,
            //     created_by: fields.staffId,
            //      laporan_id: laporan_id_exist
            // })
            res.send(JSON.stringify({status: "OK"}));

        // });
    });

    
});

router.get('/mobile_alls/:cawangan',  async function (req, res) {

    processList = ["Intake Start", "Intake End", "Blower /CHF start", "Blower / CHF End", "Record Temperature", "Sack-Off Start", "Sack-End"]
    const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
    dateNow = new Date();
    monthNo = dateNow.getMonth();
    monthNow = monthNames[dateNow.getMonth()];
    yearNow = dateNow.getFullYear();

    db.Laporan.findAll({
        where : { month: monthNow, year: yearNow, isdeleted : false, 
            isFinish: false, cawangan: req.params.cawangan },
            order: [['date_created', 'ASC']],
        include: [{
            model: db.Mesin, as: 'mesin'
        }],
        raw: true
    }).then(result => {
        let items = [];
        result.forEach((item, index) => {
            let lapor = {
                id: item['id'],
                month: item['month'],
                year: item['year'],
                batchNo: item['batchNo'],
                processName: item['processName'],
                cawangan: item['cawangan'],
                mesinId: item['mesin_id'],
                mesinName: item['mesin.ibdNo']
            }
            items.push(lapor);
        })
        
        res.send(items);
    })
});



router.post('/list/:userid',  async function (req, res) {

    const form = new formidable({multiples: true});

    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);

        user = await db.User.findOne({
            where: {id : req.params.userid}
        });
    
        wheres = {}
        if(user.jawatan == "HQ"){
            wheres = {};
        }else{
            wheres = {
                cawangan: user.cawangan
            };
        }

        if (data.batchNo !== "") {
            wheres.batchNo = {[Op.like]: '%' + data.batchNo + '%'}
        }
    
        if (data.year !== "") {
            wheres.year = {[Op.like]: '%' + data.year + '%'}
        }
    
        // if (req.body.cawangan !== "") {
        //     wheres.cawangan = {[Op.like]: '%' + req.body.cawangan + '%'}
        // }
    
        if (data.month !== "") {
            wheres.month = {[Op.like]: '%' + data.month + '%'}
        }

        db.Laporan.findAndCountAll({
            where: wheres
            //     ibdNo: {
            //         [Op.like]: '%' + req.body.ibdNo + '%'
            //     },
            //     status: {
            //         [Op.like]: '%' + req.body.status + '%'
            //     },
            //     rfidNo: {
            //         [Op.like]: '%' + req.body.rfidNo + '%'
            //     },
    
            ,
            order: [['date_created', 'DESC']],
            // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
            limit: data.pageSize,
            offset: data.page * data.pageSize,
        }).then(function (result) {
            let totalPageNum = Math.ceil(result.count / data.pageSize);

            res.send({data: result.rows, count: totalPageNum})
        });
        // res.send({data: [], count: 0})
    });
    
});

router.post('/view/:userid/:laporanID',  async function (req, res) {

        laporan = await db.Laporan.findOne({
            where: {id : req.params.laporanID}
        }).then(async function (result) {
            await db.Process.findAll({
                where: {laporan_id : req.params.laporanID},
                order: [['date_created', 'ASC']]
            }).then(function (result1) {
                res.send({data: result, data1: result1, count: 0})
            })
        });

    
        // wheres = {}
        // if(user.jawatan == "HQ"){
        //     wheres = {};
        // }else{
        //     wheres = {
        //         cawangan: user.cawangan
        //     };
        // }
        // console.log(req.body)
        // db.Laporan.findAndCountAll({
        //     where: wheres
        //     //     ibdNo: {
        //     //         [Op.like]: '%' + req.body.ibdNo + '%'
        //     //     },
        //     //     status: {
        //     //         [Op.like]: '%' + req.body.status + '%'
        //     //     },
        //     //     rfidNo: {
        //     //         [Op.like]: '%' + req.body.rfidNo + '%'
        //     //     },
    
        //     ,
        //     // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        //     limit: data.pageSize,
        //     offset: data.page * data.pageSize,
        // }).then(function (result) {
        //     let totalPageNum = Math.ceil(result.count / data.pageSize);
        //     console.log(result.rows)
        //     res.send({data: result.rows, count: totalPageNum})
        // });
        

    
});


module.exports = router;