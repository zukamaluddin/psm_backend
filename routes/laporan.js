var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const {Op} = require("sequelize");

router.get('/get_ibd/:ibdId',  async function (req, res) {
    
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
            result['status'] = "OK"
            result["processName"] = laporanExist.processName
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
                result["batchNo"] =  (monthNo >= 10) ? monthNo : 0 + monthNo.toString() + "/" + yearNow + "/"+ laporanCount + 1 + "/" + mesinExist.ibdNo
            }

            result['status'] = "OK"
            result["processName"] = "Intake Start"
            
        }

        
    }else{
        result['status'] = "Failed"
    }

    res.send(result);
});


router.post('/add_lopran',  async function (req, res) {

    const form = new formidable({multiples: true});
    let result = {};

    form.parse(req, async function (err, fields, files) {
        console.log(fields.ibdId)

        res.send(result);
    });

    
});

module.exports = router;