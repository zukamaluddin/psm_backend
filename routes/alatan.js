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

router.get('/check_sticker_no/:stiker/:alatanId/:jenis', async function (req, res) {
    let stiker = req.params.stiker;
    let jenis = req.params.jenis;
    let alatanId = req.params.alatanId;
    let jawapan = '';

    await db.Detailalatan.findOne({
        where: {
            stikerbaru: stiker,
            jenisstikerbaru: jenis
        }
    }).then(async el => {
        console.log(el);
        if (el == null) {
            jawapan = 'OK'
        } else {
            if (el.id === alatanId) {
                jawapan = 'OK'
            } else {
                let test = await db.Alatan.findOne({
                    where: {id: el.alatan_id},
                });
                // console.log(test.isdeleted)
                if (test.isdeleted === false) {
                    jawapan = 'Exist'
                } else {
                    jawapan = 'OK'
                }
            }
        }
    })

    res.send({status: 'OK', data: jawapan});
});

router.get('check_sticker_no2', async function (req, res) {
    res.send('abu')
    // let stiker = req.params.stiker;
    // let jenis = req.params.jenis;
    // let alatanId = req.params.alatanId;
    //
    // form.parse(request, async function (err, fields, files) {
    //     db.Alatan.findOne({where: {
    //         stikerbaru: stiker,
    //         jenisstikerbaru: jenis
    //     }}).then(el => {
    //         if(el != null){
    //             res.send("OK")
    //         }else{
    //             if (el.id == alatanId){
    //                 res.send("OK")
    //             }
    //             else{
    //                 res.send("Exist")
    //             }
    //         }
    //     })
    // });
});

router.get('/:user_id', auditTrail.trace, function (req, res) {
    db.User.findOne({
        where: {id: req.params.user_id},
        include: [
            {model: db.Role, as: 'role'},
            {model: db.Position, as: 'position'}
        ]
    },).then(function (data) {
        if (data) {
            res.send({
                status: 'OK',
                userid: data.id,
                email: data.email,
                name: data.name,
                phone: data.phone,
                role: data.role ? data.role.name : null,
                position: data.position ? data.position.name : null,
                picture: data.picture
            })
        } else {
            res.send({status: 'FAILED', msg: 'User not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

router.get('/cari_pemilik/:nama/:code/:roc/:alamat/:userid', auditTrail.trace, async function (req, response) {
    let nama = req.params.nama;
    let code = req.params.code;
    let roc = req.params.roc;
    let alamat = req.params.alamat;
    // form.parse(request, async function (err, fields, files) {
    //     let token = req.query
        // if (err) throw err
        // let body = JSON.parse(fields.data);
        let whereS = {isDeleted: false};

        if (nama !== 'XXX') {
            whereS.name = {
                [Op.like]: '%' + nama + '%'
            }
        }
        if (roc !== 'XXX') {
            whereS.noRocRob = {
                [Op.like]: '%' + roc + '%'
            }
        }
        if (code !== 'XXX') {
            whereS.code = {
                [Op.like]: '%' + code + '%'
            }
        }
        if (alamat !== 'XXX') {
            whereS.address = {
                [Op.like]: '%' + alamat + '%'
            }
        }

        db.Owner.findAndCountAll({
            where: whereS,
            raw: true
        }).then(results => {
            response.send({status: 'OK', data: results.rows})
        }).catch(function (err) {
            console.log(err)
            response.end(JSON.stringify({status: "ERROR"}));
        });
    // })
});

router.post('/list_alatan/:userid', auditTrail.trace, async function (req, res) {
    let username = await db.User.findOne({
        where: {id: req.params.userid}
    });
    let branch = await db.Branch.findOne({
        where: {id: username.branch_id}
    });
    let pageSize = req.body.pageSize;
    let currentPage = req.body.page;
    let where = {isdeleted: false, user_id: req.params.userid};
    let whereAssign = {};

    let bb = await Promise.all(req.body.filtered.map((item, index) => {
        let jj = {};
        return new Promise(async (resolve, reject) => {
            switch (item.id) {
                case 'resit':
                    jj['resit'] = {[Op.like]: '%' + item.value + '%'};
                    resolve(jj);
                case 'tempat':
                    jj['tempat'] = {[Op.like]: '%' + item.value + '%'};
                    resolve(jj);
                case 'tarikh':
                    jj['tarikh'] = {[Op.between]: [moment(item.value + ' 00:00:00', 'D/M/YYYY HH:mm:ss'), moment(item.value + ' 23:59:59', 'D/M/YYYY HH:mm:ss')]};
                    resolve(jj);
                case 'pembaik':
                    let vv = await new Promise(async (resolve, reject) => {
                        await db.Repairer.findAll({
                            attributes: ['id'],
                            where: {name: {[Op.like]: '%' + item.value + '%'}},
                            raw: true
                        })
                            .then(data => {
                                let gengBranch = [];
                                data.map((item) => {
                                    gengBranch.push(item['id'])
                                });
                                resolve(gengBranch)
                            })
                    });
                    jj['repairer_id'] = vv;
                    resolve(jj)
            }
        })
    }));
    bb.map((item) => {
        if ("repairer_id" in item) {
            where['repairer_id'] = item['repairer_id']
        } else if ("resit" in item) {
            where['resit'] = item['resit']
        } else if ("tempat" in item) {
            where['tempat'] = item['tempat']
        } else if ("tarikh" in item) {
            where['tarikh'] = item['tarikh']
        }

    });

    // where['repairer_id'] = bb
    // console.log(where , 'SS');
    // console.log(bb);
    //
    // let gg = req.body.filtered.forEach(async function (v) {
    //     let jj = {};
    //     switch (v.id) {
    //         case 'resit':
    //             jj['resit'] = {[Op.like]: '%' + v.value + '%'};
    //             return jj;
    //         case 'tempat':
    //             where['tempat'] = {[Op.like]: '%' + v.value + '%'};
    //             return jj;
    //         case 'pembaik':
    //             // console.log(v.value)
    //             // let xxr  = await db.Repairer.findAll({attributes: ['id'],where: {name:{[Op.like]: '%' + v.value + '%'}}, raw: true})
    //             let vv = await  new Promise(async (resolve, reject)=> {
    //                await db.Repairer.findAll({attributes: ['id'],where: {name:{[Op.like]: '%' + v.value + '%'}}, raw: true})
    //                 .then(data => {
    //                     let gengBranch = [];
    //                     data.map((item)=> {
    //                         gengBranch.push(item['id'])
    //                     });
    //                     resolve(gengBranch)
    //                     // return gengBranch;
    //                 })
    //             });
    //             // console.log(vv , 'LLL');
    //             jj['repairer_id'] = vv;
    //             // console.log(jj , "?????")
    //             return jj;
    //             // break;
    //         case 'kawasan':
    //             if (v.value !== 'All')
    //                 jj['kawasan'] = v.value;
    //             return jj;
    //         case 'date_created':
    //             jj['date_created'] = {[Op.between]: [moment(v.value + ' 00:00:00', 'D/M/YYYY HH:mm:ss'), moment(v.value + ' 23:59:59', 'D/M/YYYY HH:mm:ss')]};
    //             return jj;
    //     }
    // })
    // console.log(gg, "LLLLL")
    // console.log(kamil);
    // console.log(where , 'SS');
    // console.log('--------------------------------------------------------------------------------------------------------')

    let sorted = [];
    // req.body.sorted.forEach(function (v) {
    //     if (['description', 'priority'].includes(v.id))
    //         sorted.push([v.id, (v.desc) ? 'DESC' : 'ASC']);
    //     else if (v.id === 'date_received')
    //         sorted.push(['date_created', (v.desc) ? 'DESC' : 'ASC']);
    // });
    //
    // if (req.body.sorted.length === 0) {
    sorted = [['tarikh', 'DESC']]
    // }

    // if (user) {
    // console.log(user);

    let alatan = await db.Alatan.findAndCountAll({
        raw: true,
        where: where,
        order: sorted,
        limit: pageSize,
        offset: currentPage * pageSize,
        // include: [
        //     {model: db.Repairer, as: 'repairer'}
        // ]
    }).then(async function (data) {
        // console.log(data);
        let dataArr = [];
        if (data.count > 0) {
            // console.log('--------------------------------------------------------------------------------------------------------')


            let prom1 = await new Promise(function (resolve1, reject1) {

                data.rows.forEach(async function (v, w) {

                    let pembaik = await db.Repairer.findOne({
                        where: {id: v.repairer_id},
                    });
                    let payment = await db.Payment.findOne({
                        where: {alatan_id: v.id,is_deleted: false},
                    });
                    // let detailalat = await db.Detailalatan.findOne({
                    //     where: {alatan_id: v.id},
                    // });
                    // let pemilik =await db.Owner.findOne({
                    //     where: {id: detailalat.owner_id},
                    // });
                    // console.log(v.id);
                    obj = {};
                    obj['pembaik'] = '';
                    obj['payment'] = v.ishantar;
                    obj['hantar'] = v.ishantar;
                    if (pembaik) {
                        obj['pembaik'] = pembaik.name;
                    }
                    // else{
                    //
                    //     // if (detailalat){
                    //
                    //         if (pemilik){
                    //             obj['pembaik'] = pemilik.name;
                    //         }
                    //
                    //     // }
                    // }
                    obj['id'] = v.id;
                    obj['tarikh'] = moment(v.tarikh).format("DD/M/YYYY");

                    // obj['description'] = v.description.replace(/(<([^>]+)>)/ig,'');


                    if (payment){
                        if (v.jenisresit == 'Auto') {
                            obj['resit'] = 'DMSB/' + v.codeCawangan + '/' + v.resit;
                        } else {
                            obj['resit'] = v.resit;
                        }
                    }
                    else{
                        obj['resit'] = '';
                    }



                    obj['tempat'] = v.tempat;
                    obj['kawasan'] = v.kawasan;

                    // obj['jenis'] = v.jenis;

                    //cheating jap
                    if (obj['to'] !== '')
                        dataArr.push(obj);
                    // console.log(dataArr);

                    if (w === data.rows.length - 1) {
                        resolve1({status: 'OK', data: dataArr, count: Math.ceil(data.count / pageSize)})
                    }
                });
            });

            return prom1;
        } else {
            return {status: 'OK', data: dataArr, count: Math.ceil(data.count / pageSize)}
        }


    }).catch(function (err) {
        console.log(err);
        res.send({status: 'FAILED', data: [], count: 1})
    });

    res.send(alatan)
    // } else {
    //     res.send({status: 'FAILED', msg: 'User does not exist'})
    // }
});

router.delete('/delete', auditTrail.trace, function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.User.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'User deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }

});

router.get('/updatecaj/:caj/:kategori_id/:userid', auditTrail.trace, function (req, res) {

    console.log(req.params.kategori_id);
    let kategori_id = req.params.kategori_id;
    let caj = req.params.caj;

    if ( parseFloat(caj)){
        new_caj = parseFloat(caj).toFixed(2)
        console.log(new_caj)
       let updateValues = {
            harga: new_caj,
        };

        db.Kategori.update(updateValues, {where: {id: kategori_id}})
            .then(async function (dt) {
                res.send(JSON.stringify({status: 'OK', msg: 'Updated'}))
            }).catch(function (err) {
                // console.log(err)
                res.send(JSON.stringify({status: 'FAILED', msg: 'An error has occured!'}))
            });
    }else{
       res.send(JSON.stringify({status: 'FAILED', msg: 'Not valid value!'}))
    }

});

router.get('/tambahkategori/:caj/:kategori/:lain_id/:userid', auditTrail.trace, async function (req, res) {

    console.log(req.params.kategori);
    let kategori = req.params.kategori;
    let lain_id = req.params.lain_id;
    let caj = req.params.caj;

    if ( parseFloat(caj)){
        new_caj = parseFloat(caj).toFixed(2);

        sorted = [['no', 'DESC']]
        let where = {lain_id: lain_id};
        let cari = await db.Kategori.findOne({
            where: where,
            order: sorted,
        });
        let nomb = 0;
        if (cari) {
            nomb = Number(cari.no) + 1;
        } else {
            nomb = 1;
        }

        await db.Kategori.create({
            name: kategori,
            no: nomb,
            harga: new_caj,
            lain_id: lain_id,
        }).then(async function (dt) {
                res.send(JSON.stringify({status: 'OK', msg: 'Add'}))
            }).catch(function (err) {
                // console.log(err)
                res.send(JSON.stringify({status: 'FAILED', msg: 'An error has occured!'}))
            });
    }else{
       res.send(JSON.stringify({status: 'FAILED', msg: 'Not valid value!'}))
    }
});

router.post('/update/:userid', auditTrail.trace, function (request, response) {
    const form = new formidable.IncomingForm();
    // let report_id = uuidv4();
    let timex = 0;
    let attch_detail = [];

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let detailData = data['valueDetail']
        let alatanId = data['valueId']
        let updateValues = {
            tempat: data['valueTempat'],
            jenistempat: data['valueJenisTempat'],
            tarikh: data['valueTarikh'],
            tahun: moment(data['valueTarikh']).format("YYYY"),
            repairer_id: data['valueRepairer'],
            // report_id = dt.id;
        }

        await db.Alatan.update(updateValues, {where: {id: data['valueId']}})
            .then(async function (dt) {
                data['valueDelete'].forEach(element => {
                    db.Detailalatan.destroy({where: {id: element}})
                });
                let Test = await Promise.all(data['valueDetail'].map(async (element, index) => {
                    if (element['lama'] == '1') {
                        let updateDetailValues = {
                            kategori_id: element['kategori_id'],
                            had: element['had'],
                            jenishad: element['jenishad'],
                            jenama: element['jenama'],
                            siri: element['siri'],
                            caj: element['caj'],
                            tentusan: element['tentusan'],
                            tarikh: element['tarikhalatan'],
                            nombordaftar: element['nombordaftar'],
                            nomborsijil: element['nomborsijil'],
                            alamatalatan: element['alamatalatan'],
                            stikerbaru: element['stikerbaru'],
                            jenisstikerbaru: element['jenisstikerbaru'],
                            stikerlama: element['stikerlama'],
                            user_id: element['pegawaitentusah_id'],
                            owner_id: element['pemilik_id'] !== 'pembaik' ? element['pemilik_id'] : null,
                            jenisstikerlama: element['jenisstikerlama'],
                            // alatan_id: dt.id,
                            // report_id = dt.id;
                        }
                        await db.Detailalatan.update(updateDetailValues, {where: {id: element['id']}})

                        return true;

                    } else if (element['lama'] == '0') {
                        await db.Detailalatan.create({
                            kategori_id: element['kategori_id'],
                            had: element['had'],
                            jenishad: element['jenishad'],
                            jenama: element['jenama'],
                            siri: element['siri'],
                            caj: element['caj'],
                            tentusan: element['tentusan'],
                            nombordaftar: element['nombordaftar'],
                            nomborsijil: element['nomborsijil'],
                            alamatalatan: element['alamatalatan'],
                            tarikh: element['tarikhalatan'],
                            stikerbaru: element['stikerbaru'],
                            jenisstikerbaru: element['jenisstikerbaru'],
                            stikerlama: element['stikerlama'],
                            jenisstikerlama: element['jenisstikerlama'],
                            user_id: element['pegawaitentusah_id'],
                            alatan_id: alatanId,
                            owner_id: element['pemilik_id'] !== 'pembaik' ? element['pemilik_id'] : null,

                        })
                        return true;
                    }

                }))

                // await data['valueDetail'].forEach(element => {
                //     if (element['lama'] == '1') {
                //         let updateDetailValues = {
                //             kategori_id: element['kategori_id'],
                //             had: element['had'],
                //             jenishad: element['jenishad'],
                //             jenama: element['jenama'],
                //             siri: element['siri'],
                //             caj: element['caj'],
                //             tentusan: element['tentusan'],
                //             nombordaftar: element['nombordaftar'],
                //             nomborsijil: element['nomborsijil'],
                //             stikerbaru: element['stikerbaru'],
                //             jenisstikerbaru: element['jenisstikerbaru'],
                //             stikerlama: element['stikerlama'],
                //             owner_id: element['pemilik_id'],
                //             jenisstikerlama: element['jenisstikerlama'],
                //             // alatan_id: dt.id,
                //             // report_id = dt.id;
                //         }
                //         db.Detailalatan.update(updateDetailValues, {where: {id: element['id']}})
                //
                //     } else if (element['lama'] == '0') {
                //         let newDetail = {
                //             kategori_id: element['kategori_id'],
                //             had: element['had'],
                //             jenishad: element['jenishad'],
                //             jenama: element['jenama'],
                //             siri: element['siri'],
                //             caj: element['caj'],
                //             tentusan: element['tentusan'],
                //             nombordaftar: element['nombordaftar'],
                //             nomborsijil: element['nomborsijil'],
                //             stikerbaru: element['stikerbaru'],
                //             jenisstikerbaru: element['jenisstikerbaru'],
                //             stikerlama: element['stikerlama'],
                //             jenisstikerlama: element['jenisstikerlama'],
                //             alatan_id: alatanId,
                //             owner_id: element['pemilik_id'],
                //         }
                //         // console.log(alatanId)
                //         // console.log(newDetail)
                //         db.Detailalatan.create(newDetail)
                //     }
                //
                //
                // })

                response.send(JSON.stringify({status: 'OK', msg: 'Updated'}))
            }).catch(function (err) {
                // console.log(err)
                response.send(JSON.stringify({status: 'FAILED', msg: 'An error has occured!'}))
            });


    });
});

router.post('/updateborang/:userid', auditTrail.trace, function (request, response) {
    const form = new formidable.IncomingForm();
    // let report_id = uuidv4();
    let timex = 0;
    let attch_detail = [];

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let detailData = data['valueDetail']
        let alatanId = data['valueId']
        let updateValues = {
            tempat: data['valueTempat'],
            jenistempat: data['valueJenisTempat'],
            tarikh: data['valueTarikh'],
            ishantar: true,
            borang: true,
            tahun: moment(data['valueTarikh']).format("YYYY"),
            repairer_id: data['valueRepairer'],
            // report_id = dt.id;
        }

        await db.Alatan.update(updateValues, {where: {id: data['valueId']}})
            .then(async function (dt) {
                data['valueDelete'].forEach(element => {
                    db.Detailalatan.destroy({where: {id: element}})
                });
                let Test = await Promise.all(data['valueDetail'].map(async (element, index) => {

                        await db.Detailalatan.create({
                            // kategori_id: element['kategori_id'],
                            had: '',
                            jenishad: '',
                            jenama: '',
                            siri:'',
                            caj: '0',
                            tentusan: '',
                            nombordaftar: '',
                            nomborsijil: '',
                            alamatalatan: '',
                            stikerbaru: '',
                            jenisstikerbaru: '',
                            stikerlama: '',
                            jenisstikerlama: '',
                            user_id: element['pegawaitentusah_id'],
                            alatan_id: alatanId,
                            owner_id: element['pemilik_id'] !== 'pembaik' ? element['pemilik_id'] : null,

                        })
                        return true;

                }))

                response.send(JSON.stringify({status: 'OK', msg: 'Updated'}))
            }).catch(function (err) {
                // console.log(err)
                response.send(JSON.stringify({status: 'FAILED', msg: 'An error has occured!'}))
            });


    });
});
router.post('/updatealatan/:userid', auditTrail.trace, function (request, response) {
    const form = new formidable.IncomingForm();
    // let report_id = uuidv4();
    let timex = 0;
    let attch_detail = [];

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let detailData = data['valueDetail']
        let alatanId = data['valueId']
        let updateValues = {
            tempat: data['valueTempat'],
            jenistempat: data['valueJenisTempat'],
            tarikh: data['valueTarikh'],
            tahun: moment(data['valueTarikh']).format("YYYY"),
            repairer_id: data['valueRepairer'],
            ishantar: true,
            // report_id = dt.id;
        }

        await db.Alatan.update(updateValues, {where: {id: data['valueId']}})
            .then(async function (dt) {
                data['valueDelete'].forEach(element => {
                    db.Detailalatan.destroy({where: {id: element}})
                });
                response.send(JSON.stringify({status: 'OK', msg: 'Updated'}))
            }).catch(function (err) {
                // console.log(err)
                response.send(JSON.stringify({status: 'FAILED', msg: 'An error has occured!'}))
            });


    });
});

router.post('/create/:userid', auditTrail.trace, function (request, response) {
    const form = new formidable.IncomingForm();
    // let report_id = uuidv4();
    let timex = 0;
    let attch_detail = [];

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);

        let idbaru = '';

        let pegawai = await db.User.findOne({
            where: {id: data['valuePegawaiId']},
            include: [
                {model: db.Branch, as: 'branch'}
            ]
        });
        let brach_code = pegawai.branch.code

        // console.log(moment(data['valueTarikh']).format("YYYY"))
        await db.Alatan.create({
            tempat: data['valueTempat'],
            codeCawangan: brach_code,
            jenistempat: data['valueJenisTempat'],
            user_id: data['valuePegawaiId'],
            resit: '',
            tahun: moment(data['valueTarikh']).format("YYYY"),
            tarikh: data['valueTarikh'],
            jenisresit: '',
            repairer_id: data['valueRepairer'] !== '' ? data['valueRepairer'] : null,
            // report_id = dt.id;
        }).then(async function (dt) {
            idbaru = dt.id;
            // report_id = dt.id;
            await data['valueDetail'].forEach(element => {
                db.Detailalatan.create({
                    kategori_id: element['kategori_id'],
                    had: element['had'],
                    jenishad: element['jenishad'],
                    jenama: element['jenama'],
                    siri: element['siri'],
                    caj: element['caj'],
                    tentusan: element['tentusan'],
                    tarikh: element['tarikhalatan'],
                    nombordaftar: element['nombordaftar'],
                    nomborsijil: element['nomborsijil'],
                    stikerbaru: element['stikerbaru'],
                    alamatalatan: element['alamatalatan'],
                    jenisstikerbaru: element['jenisstikerbaru'],
                    stikerlama: element['stikerlama'],
                    jenisstikerlama: element['jenisstikerlama'],
                    user_id: element['pegawaitentusah_id'],
                    alatan_id: dt.id,
                    owner_id: element['pemilik_id'] !== 'pembaik' ? element['pemilik_id'] : null,


                })

            });
        });

        response.send(JSON.stringify({status: "OK",id:idbaru}));
        response.end();


    });
});

router.post('/createalatan/:userid', auditTrail.trace, function (request, response) {
    const form = new formidable.IncomingForm();
    // let report_id = uuidv4();
    let timex = 0;
    let attch_detail = [];

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);

        let idbaru = '';

        let pegawai = await db.User.findOne({
            where: {id: data['valuePegawaiId']},
            include: [
                {model: db.Branch, as: 'branch'}
            ]
        });
        let brach_code = pegawai.branch.code

        // console.log(moment(data['valueTarikh']).format("YYYY"))
        await db.Alatan.create({
            tempat: data['valueTempat'],
            codeCawangan: brach_code,
            jenistempat: data['valueJenisTempat'],
            user_id: data['valuePegawaiId'],
            resit: '',
            tahun: moment(data['valueTarikh']).format("YYYY"),
            tarikh: data['valueTarikh'],
            jenisresit: '',
            // isdeleted: true,
            ishantar: true,
            repairer_id: data['valueRepairer'] !== '' ? data['valueRepairer'] : null,
            // report_id = dt.id;
        }).then(async function (dt) {
            idbaru = dt.id;
            // report_id = dt.id;
            // await data['valueDetail'].forEach(element => {
            //     db.Detailalatan.create({
            //         kategori_id: element['kategori_id'],
            //         had: element['had'],
            //         jenishad: element['jenishad'],
            //         jenama: element['jenama'],
            //         siri: element['siri'],
            //         caj: element['caj'],
            //         tentusan: element['tentusan'],
            //         nombordaftar: element['nombordaftar'],
            //         nomborsijil: element['nomborsijil'],
            //         stikerbaru: element['stikerbaru'],
            //         jenisstikerbaru: element['jenisstikerbaru'],
            //         stikerlama: element['stikerlama'],
            //         jenisstikerlama: element['jenisstikerlama'],
            //         user_id: element['pegawaitentusah_id'],
            //         alatan_id: dt.id,
            //         owner_id: element['pemilik_id'] !== 'pembaik' ? element['pemilik_id'] : null,
            //
            //
            //     })
            //
            // });
        });

        response.send(JSON.stringify({status: "OK",id:idbaru}));
        response.end();


    });
});

router.post('/delete_alatan/:userid', auditTrail.trace, async function (req, res) {
    let ids = req.body.ids;

    // let user = await db.User.findOne({where: {id: req.params.userid}})
    //     .then(function (result) {
    //         return result
    //     }).catch(function (err) {
    //         return err
    //     });
    // if (user) {
    let report = await db.Alatan.update({isdeleted: true}, {where: {id: ids}})
        .then(function (result) {
            return result
        }).catch(function (err) {
            return err
        });

    res.send({status: 'OK', msg: report[0] + ' row(s) affected'})
    // } else {
    //     res.send({status: 'FAILED', msg: 'User does not exist'})
    // }


});

router.get('/download/:report_id/:filename/:userid', auditTrail.trace, function (req, res) {
    // console.log(req.params['filename'])
    const file = `${__dirname}/../public/report/${req.params['report_id']}/${req.params['filename']}`;
    res.download(file); // Set disposition and send it.
});

router.post('/delete_report_received/:userid', auditTrail.trace, async function (req, res) {
    let ids = req.body.ids;

    let user = await db.User.findOne({where: {id: req.params.userid}})
        .then(function (result) {
            return result
        }).catch(function (err) {
            return err
        });

    if (user) {
        let report = await db.SentReport.update({isDeleted: true}, {where: {report_id: ids, user_id: user.id}})
            .then(function (result) {
                return result
            }).catch(function (err) {
                return err
            });

        res.send({status: 'OK', msg: report[0] + ' row(s) affected'})
    } else {
        res.send({status: 'FAILED', msg: 'User does not exist'})
    }


});

router.get('/get_sijil/:detailalatanid/:userid', auditTrail.trace, async function (req, res) {
    let detailalatanid = req.params.detailalatanid;
    let detailalatan = await db.Detailalatan.findOne({
        where: {id: detailalatanid},
        // include: [
        //     {model: db.User, as: 'user'}
        // ]
    });

    let ketegori = await db.Kategori.findOne({
        where: {id: detailalatan.kategori_id},
    });

    let lain = await db.Lain.findOne({
        where: {id: ketegori.lain_id},
    });

    let jenis = await db.Jenis.findOne({
        where: {id: lain.jenis_id},
    });

    let alatan = await db.Alatan.findOne({
        where: {id: detailalatan.alatan_id},
    });
    let pemilik = await db.Owner.findOne({
        where: {id: detailalatan.owner_id},
    });

    let pembaik = await db.Repairer.findOne({
        where: {id: alatan.repairer_id},
    });
    let pegawai = await db.User.findOne({
        where: {id: detailalatan.user_id},
        include: [
            {model: db.Branch, as: 'branch'}
        ]
    });
    let brach_code = pegawai.branch.code
    let brach_name = pegawai.branch.regional
    console.log(pegawai.branch.regional);
    let code_lain = jenis.dataValues.name.split(' ')[0]


    let obj = {};
    let obj1 = {};
    let obj2 = {};
    let obj3 = {};
    if (alatan && detailalatan) {
        obj['noSiriAlat'] = detailalatan.siri;
        obj['noPelekatKeselamatan'] = `${detailalatan.jenisstikerbaru} ${detailalatan.stikerbaru}`;
        obj['maklumatPemilik'] = [];

        if (pemilik) {
            obj1['nama'] = pemilik.dataValues.name;
            obj1['alamat'] = pemilik.dataValues.address ;
        } else {
            obj1['nama'] = pembaik.dataValues.name;
            obj1['alamat'] = pembaik.dataValues.address ;
        }
        obj['maklumatPemilik'].push(obj1);


        obj['maklumatPembaik'] = [];
        if (pembaik) {
            obj2['nama'] = pembaik.name;
            obj2['alamat'] = pembaik.dataValues.address ;
            // obj2['alamat'] = pembaik.streetAddressNo;
        } else {
            obj2['nama'] = "-";
            obj2['alamat'] = "-";
        }
        obj['maklumatPembaik'].push(obj2);

        // obj['tempatPenentuan'] = pegawai.branch.regional;

        // console.log(detailalatan)
        // console.log('alamatalaran = ',detailalatan.alamatalatan)
        if (detailalatan.alamatalatan === null || detailalatan.alamatalatan === '' ){
            // console.log(alatan.tempat);
            // console.log('-----------------------------------------------------------------');
            obj['tempatPenentuan'] = alatan.tempat;
            if (alatan.jenistempat === 'Pejabat Cawangan') {
                obj['tempatPenentuan'] = pegawai.branch.regional;
            }
        }
        else{
            obj['tempatPenentuan'] = detailalatan.alamatalatan;
            if (alatan.jenistempat === 'Pejabat Cawangan') {
                obj['tempatPenentuan'] = pegawai.branch.regional;
            }
        }
        // console.log('tempatPenentuan = ',obj['tempatPenentuan'])

        obj['itemList'] = [];
        if (detailalatan.tentusan === 'Gagal') {
            obj3['jenama'] = lain.name + ' ' + detailalatan.jenama + ` [${detailalatan.had} ${detailalatan.jenishad}]`;
            obj3['siri'] = brach_code + '-' + code_lain + '-' + detailalatan.nombordaftar;
            obj3['noDaftar'] = detailalatan.nombordaftar;
            obj3['harga'] = detailalatan.caj;
            obj['itemList'].push(obj3);
        } else {
            obj3['jenama'] = lain.name + ' ' + detailalatan.jenama + ` [${detailalatan.had} ${detailalatan.jenishad}]`;
            obj3['siri'] = brach_code + '-' + code_lain + '-' + detailalatan.nombordaftar;
            obj3['noDaftar'] = detailalatan.nombordaftar;
            let price = (parseFloat(detailalatan.caj) - 1);
            price = parseFloat(price).toFixed(2)
            obj3['harga'] = price.toString();
            obj['itemList'].push(obj3);

            obj3 = {};
            obj3['jenama'] = 'Sijil';
            obj3['siri'] = '';
            obj3['noDaftar'] = detailalatan.nombordaftar;
            obj3['harga'] = '1.00';
            obj['itemList'].push(obj3);
        }

        obj['namaPegawai'] = pegawai.name;
        obj['alamat'] = alatan.alamat;

        obj['kegunaan'] = '';
        if (jenis.kegunaan === 'Bukan Untuk Kegunaan Perdagangan') {
            obj['kegunaan'] = 'BUKAN UNTUK KEGUNAAN PERDAGANGAN';
        }
        obj['tarikh'] = detailalatan.tarikh;
        console.log(obj)
        res.send({status: 'OK', data: obj});
    } else {
        res.send({status: 'FAILED', msg: 'Report does not exist'});
    }


});

router.get('/get_alatan/:alatanid/:userid', auditTrail.trace, async function (req, res) {
    let alatanid = req.params.alatanid;

    let alatan = await db.Alatan.findOne({
        where: {id: alatanid},
        // include: [
        //     {model: db.User, as: 'user'}
        // ]
    });
    let pegawai = await db.User.findOne({
        where: {id: alatan.user_id},
    });
    let kawasan = await db.Branch.findOne({
        where: {id: pegawai.branch_id},
    });
    if (alatan.codeCawangan != null){
        let kawasan = await db.Branch.findOne({
            where: {id: pegawai.branch_id},
        });
    }

    // console.log(kawasan)

    let pembaik = await db.Repairer.findOne({
        where: {id: alatan.repairer_id},
    });

    let obj = {};
    if (alatan) {
        obj['date_created'] = moment(alatan.date_created).format("DD/M/YYYY hh:mm");
        obj['kawasan'] = kawasan.regional;
        obj['kawasan_id'] = kawasan.id;
        obj['kawasan_code'] = kawasan.code;
        obj['hantar'] = alatan.ishantar;
        obj['tempat'] = alatan.tempat;
        obj['tarikh'] = moment(alatan.tarikh).format("YYYY-M-DD");
        obj['jenistempat'] = alatan.jenistempat;
        obj['rujukan'] = '';
        obj['resit'] = '';
        obj['jenisresit'] = '';
        let payment = await db.Payment.findOne({
            where: {alatan_id: alatanid,is_deleted: false},
        });

        if (payment){
            obj['jenisresit'] = alatan.jenisresit;
            obj['resit'] = alatan.resit;
            // let payment = await db.Payment.findOne({
            //     where: {alatan_id: alatan.id},
            // });
            if (payment.noRujukan !== null){
                obj['rujukan'] = payment.noRujukan;;
            }
        }

        obj['resitcawangan'] = 'DMSB/' + alatan.codeCawangan + '/' + alatan.tahun + '/' + alatan.resit;

        obj['id'] = alatan.id;
        obj['borang'] = alatan.borang;
        obj['codeCawangan'] = alatan.codeCawangan;
        obj['tahun'] = alatan.tahun;
        obj['pegawai'] = pegawai.name;
        obj['pegawai_id'] = alatan.user_id;
        if (pembaik) {
            obj['pembaik'] = pembaik.name;
            obj['pembaik_id'] = alatan.repairer_id;
            obj['pembaik_alamat'] = pembaik.address;
        } else {
            obj['pembaik'] = '';
            obj['pembaik_id'] = '';
            obj['pembaik_alamat'] = '';
        }
        obj['id'] = alatan.id;
        // obj['detail'] = [];
        // obj['detail'].push({
        //     hhh:'lll'
        // });

        // console.log(alatanid)
        let sorted = [];
        sorted = [['date_created', 'ASC']]

        await db.Detailalatan.findAndCountAll({
            where: {alatan_id: alatan.id},
            order: sorted,
        }).then(async function (data) {

            return await Promise.all(data.rows.map(async (x, index) => {
                let kkatch = {};
                let kategori = await db.Kategori.findOne({
                    where: {id: x.kategori_id},
                });
                if (kategori){

                }

                let pemilik = await db.Owner.findOne({
                    where: {id: x.owner_id},
                });
                let pegawaitentusah = await db.User.findOne({
                    where: {id: x.user_id},
                });

                kkatch['id'] = x.id;
                if (kategori) {
                    // console.log(kategori)
                    let lain = await db.Lain.findOne({
                        where: {id: kategori.lain_id},
                    });
                    let jenis = await db.Jenis.findOne({
                        where: {id: lain.jenis_id},
                    });
                    kkatch['kategori'] = kategori.name;
                    kkatch['lain_id'] = lain.id;
                    kkatch['kegunaan'] = jenis.kegunaan;
                    kkatch['jenis_id'] = jenis.id;
                    kkatch['jenis'] = jenis.name;
                    kkatch['kategori_id'] = kategori.id;
                    kkatch['lain'] = lain.name;
                }
                if (pemilik) {
                    kkatch['usertype'] = 'pemilik'
                    kkatch['pemilik_id'] = x.owner_id;
                    kkatch['pemilik'] = pemilik.name
                } else {
                    kkatch['usertype'] = 'pembaik'
                    kkatch['pemilik_id'] = 'pembaik';
                    kkatch['pemilik'] = obj['pembaik']
                }

                if (pegawaitentusah) {
                    kkatch['pegawaitentusah_id'] = pegawaitentusah.id;
                    kkatch['pegawaitentusah'] = pegawaitentusah.name
                } else {
                    kkatch['pegawaitentusah_id'] = pegawai.id;
                    kkatch['pegawaitentusah'] = pegawai.name
                }

                if(x.tarikh == null){
                    kkatch['tarikhalatan'] = '';
                }
                else {
                    kkatch['tarikhalatan'] = moment(x.tarikh).format("YYYY-M-DD");
                }

                kkatch['had'] = x.had;
                kkatch['hadpenuh'] = x.had + ' ' + x.jenishad;
                kkatch['jenishad'] = x.jenishad;
                kkatch['alamatalatan'] = x.alamatalatan;
                kkatch['jenama'] = x.jenama;
                kkatch['siri'] = x.siri;
                kkatch['caj'] = x.caj;
                kkatch['tentusan'] = x.tentusan;
                kkatch['nombordaftar'] = x.nombordaftar;
                kkatch['nomborsijil'] = x.nomborsijil;
                kkatch['stikerbaru'] = x.stikerbaru;
                kkatch['jenisstikerbaru'] = x.jenisstikerbaru;
                kkatch['stikerbarufull'] = x.jenisstikerbaru +' '+ x.stikerbaru;
                kkatch['stikerlama'] = x.stikerlama;
                kkatch['jenisstikerlama'] = x.jenisstikerlama;x.stikerbaru;
                kkatch['sijil'] = x.sijil;
                kkatch['lama'] = '1';
                kkatch['update'] = '0';

                return kkatch;
            }));

        }).then(data => {
            obj['detail'] = data;
            res.send({status: 'OK', data: obj});
        })


    } else {
        res.send({status: 'FAILED', msg: 'Report does not exist'});
    }


});

router.get('/caristiker/:nostiker/:jenis', auditTrail.trace, async function (req, res) {
    let jenis = req.params.jenis;
    let nostiker = req.params.nostiker;
    // obj = [];

    let branch = await db.Alatan.findAll({attributes: ['id'], where: {isdeleted: false}, raw: true})
        .then(data => {
            let gengBranch = [];
            data.map((item) => {
                gengBranch.push(item['id'])
            });
            return gengBranch;
        })
    let where = {jenisstikerbaru: jenis, alatan_id: branch};
    if (nostiker !== 'All') {
        where['stikerbaru'] = {[Op.like]: '%' + nostiker + '%'};
    }


    let sorted = [];
        sorted = [['stikerbaru', 'DESC']]

    let test = await db.Detailalatan.findAndCountAll({
        raw: true,
        where: where,order:sorted
    }).then(async function (data) {
        let dataArr = [];
        if (data.count > 0) {
            let prom1 = await new Promise(function (resolve1, reject1) {

                data.rows.forEach(async function (v, w) {
                    // console.log(v)
                    let alatan = await db.Alatan.findOne({
                        where: {id: v.alatan_id},
                    });
                    let user = await db.User.findOne({
                        where: {id: alatan.user_id},
                    });
                    let cawangan = await db.Branch.findOne({
                        where: {id: user.branch_id},
                    });
                    let kkatch = {};
                    kkatch['id'] = v.id;
                    kkatch['nostiker'] = v.stikerbaru;
                    kkatch['tarikh'] = moment(alatan.tarikh).format("DD/M/YYYY hh:mm");
                    kkatch['jenis'] = v.jenisstikerbaru;
                    kkatch['cawangan'] = cawangan.regional;
                    kkatch['codecawangan'] = cawangan.code;
                    kkatch['pegawai'] = user.name;
                    dataArr.push(kkatch);

                    if (w === data.rows.length - 1) {
                        resolve1({status: 'OK', data: dataArr})
                    }
                });
            });

            return prom1;
        } else {
            return {status: 'OK', data: dataArr}
        }


    }).catch(function (err) {
        console.log(err);
        res.send({status: 'FAILED', data: []})
    });

    res.send(test)


});

// API UNTUK PEGAWAI TENTUSAH
router.get('/update_pegawaitentusah/:userid', auditTrail.trace, async function (req, res) {
    let obj = [];
    let whereS = {user_id: 'NULL'};

    await db.Detailalatan.findAndCountAll({

    }).then(async function (data) {
        // console.log(data.count)
        let prom1 = await new Promise(function (resolve1, reject1) {
            data.rows.forEach(async function (v, w) {
                // if (v.user_id === ''){
                     let alatan = await db.Alatan.findOne({
                        where: {id: v.alatan_id},
                    });
                    let updateDetailValues = {
                        user_id: alatan.user_id
                    }
                    await db.Detailalatan.update(updateDetailValues, {where: {id: v.id}})
                // }

            });
        });

        return prom1;
    });

    res.send({status: 'OK'});


});

router.get('/get_pegawai_cawangan/:userid', auditTrail.trace, async function (req, res) {
    let obj = [];
    let user_id = req.params.userid;
    let user = await db.User.findOne({
        where: {id: user_id}
    });
    let whereS = {status: true, branch_id: user.branch_id};

    await db.User.findAndCountAll({
        where: whereS,
    }).then(function (data) {
        data.rows.forEach(function (x, i) {
            let kkatch = {}
            kkatch['id'] = x.id;
            kkatch['name'] = x.name;
            obj.push(kkatch);
        });
    });

    res.send({status: 'OK', data: obj});


});

router.get('/get_pegawai_all/:userid', auditTrail.trace, async function (req, res) {

    let user_id = req.params.userid;
    let user = await db.User.findOne({
        where: {id: user_id},
        include: [
            {model: db.Branch, as: 'branch'},
            {model: db.Position, as: 'position'},
        ]
    });

    let condition={};
    if (user.position.name === 'Manager Cawangan') {
        condition = {branch_id: user.branch.id}
    } else if (user.position.name === 'Staf') {
        condition = {branch_id: user.branch.id}
    } else if (user.position.name === 'Manager Negeri') {
        conditionx = {state: user.branch.state}
        let branchx = await db.Branch.findAll({where: conditionx, order: [['code', 'ASC']]});
        let arrResult = []
        for (const data of branchx) {
            arrResult.push(data.id)
        }
        // console.log(arrResult)
        condition = {branch_id:  arrResult}
    }
    // else {
    //     condition = {branch_id: null}
    // }

    let obj = [];

    let sorted = [];
        sorted = [['name', 'ASC']]

    // console.log('xxxxxxxxxxxxxxxxxxxxxx')
    await db.User.findAndCountAll({
        where: condition,
        order: sorted,
    }).then(function (data) {
        data.rows.forEach(function (x, i) {
            let kkatch = {}
            kkatch['id'] = x.id;
            kkatch['name'] = x.name;
            obj.push(kkatch);
        });
    });

    res.send({status: 'OK', data: obj});


});

router.get('/get_pembaik/:userid', auditTrail.trace, async function (req, res) {
    let obj = [];
    let whereS = {isDeleted: false};

    let sorted = [];
    sorted = [['name', 'ASC']]

    await db.Repairer.findAndCountAll({
        where: whereS, order: sorted
    }).then(function (data) {
        data.rows.forEach(function (x, i) {
            let kkatch = {}
            kkatch['id'] = x.id;
            kkatch['name'] = x.name;
            obj.push(kkatch);
        });
    });

    res.send({status: 'OK', data: obj});


});
router.get('/get_pemilik/:userid', auditTrail.trace, async function (req, res) {
    let obj = [];
    let whereS = {isDeleted: false};

    let sorted = [];
    sorted = [['name', 'ASC']]

    await db.Owner.findAndCountAll({
        where: whereS, order: sorted
    }).then(function (data) {
        data.rows.forEach(function (x, i) {
            let kkatch = {}
            kkatch['id'] = x.id;
            kkatch['name'] = x.name;
            kkatch['value'] = x.id;
            kkatch['label'] = x.name;

            obj.push(kkatch);
        });
    });

    res.send({status: 'OK', data: obj});


});

router.post('/carianmaklumat', async function(request, res) {

    // let kategori = await db.Kategori.findOne({
    //     where: {id: x.kategori_id},
    // });
    // let lain = await db.Lain.findOne({
    //     where: {id: kategori.lain_id},
    // });
    // let jenis = await db.Jenis.findOne({
    //     where: {id: lain.jenis_id},
    // });

    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {

        console.log(fields);

        let jenis = await db.Lain.findAll({attributes: ['id'], where: {jenis_id:fields.jenis }, raw: true})
        .then(data => {
            let gengLain = [];
            data.map((item) => {
                gengLain.push(item['id'])
            });
            return gengLain;
        });

        let lain = await db.Kategori.findAll({attributes: ['id'], where: {lain_id:jenis }, raw: true})
        .then(data => {
            let gengKate = [];
            data.map((item) => {
                gengKate.push(item['id'])
            });
            return gengKate;
        });

        let branch  = await db.User.findAll({attributes: ['id'],where: {branch_id: fields.cawangan}, raw: true})
        .then(data => {
            let gengBranch = [];
            data.map((item)=> {
                gengBranch.push(item['id'])
            });
            return gengBranch;
        })

        let whereS = {kategori_id:lain,user_id:branch};
        let whereSS = {};

        let sorted = [];
        sorted = [['date_created', 'ASC']]

        let startdate =  fields.datestart + ' 00:00:00'//moment(fields.datestart + '00:00:00', 'D/M/YYYY HH:mm:ss');
        // startdate = startdate + ' 00:00:00';
        console.log(startdate)
        let enddate =fields.dateend + ' 23:59:59'
        // enddate = enddate + ' 23:59:59';
        console.log(enddate)
        whereSS.tarikh = {[Op.between]: [startdate, enddate]}
        // whereSS.stikerbaru = {[Op.between]: [moment(startdate , 'YYYY-MM-DD HH:mm:ss'), moment(enddate, 'YYYY-MM-DD HH:mm:ss')]}

        let rodeStatus = true;

        if(rodeStatus){
            let data = await db.Detailalatan.findAll({
                where: whereS,
                limit: 40,
                order: sorted,
                include: [
                    {model: db.Alatan, as: 'alatan',where:whereSS, include: [{model: db.Repairer, as: 'repairer', attributes: ['name','address']}
                ]},
                    {model: db.Owner, as: 'owner',attributes: ['name','address']},
                ],
                raw: true,
            })
            let vData = await Promise.all(
                data.map(async (item, index) => {
                    let pegawai = await db.User.findOne({
                        where: {id: item['alatan.user_id']},
                        include: [
                            {model: db.Branch, as: 'branch'}
                        ]
                    });
                    let kategori = await db.Kategori.findOne({
                        where: {id: item['kategori_id']},
                        include: [
                            {model: db.Lain, as :'lain', include: [{
                                model: db.Jenis, as: 'jenis'
                            }]
                        }]
                    })

                    item['jenis_alatan'] = kategori.lain.jenis.name;
                    item['jenis_alatanlite'] = kategori.lain.jenis.name.slice(0,3);
                    item['lain'] = kategori.lain.name;
                    item['kategori'] = kategori.name;
                    item['code_kawasan'] = pegawai.branch.code;
                    item['pegawai_name'] = pegawai.name;
                    item['tarikh'] = moment(item['alatan.tarikh']).format("DD-MMM-YYYY");

                    return item;
                })
            )

            res.send({status: 'OK' , data: vData})

        }else{
            res.send({status: 'OK' , data: []})
        }



    });


});

router.get('/get_jenis/:kegunaan/:userid', auditTrail.trace, async function (req, res) {
    let kegunaan = req.params.kegunaan;
    let obj = [];
    let whereS = []
    sorted = [['no', 'ASC']];
    if (kegunaan === 'A') {
        whereS = {kegunaan: 'Untuk Kegunaan Perdagangan'};
    } else if (kegunaan === 'B'){
        whereS = {kegunaan: 'Bukan Untuk Kegunaan Perdagangan'};
    }

    await db.Jenis.findAndCountAll({
        where: whereS, order: sorted,
    }).then(function (data) {
        data.rows.forEach(function (x, i) {
            let kkatch = {}
            kkatch['id'] = x.id;
            kkatch['name'] = x.name;
            obj.push(kkatch);
        });
    });

    res.send({status: 'OK', data: obj});


});

router.post('/update_printsijil/:userid', auditTrail.trace, async function (req, res) {
    let ids = req.body.ids;

    let report = await db.Detailalatan.update({sijil: true}, {where: {id: ids}})
        .then(function (result) {
            return result
        }).catch(function (err) {
            return err
        });

    res.send({status: 'OK', msg: report[0] + ' row(s) affected'})


});

router.get('/get_lain/:jenis_id/:userid', auditTrail.trace, async function (req, res) {
    let jenis_id = req.params.jenis_id;
    let obj = [];
    sorted = [['no', 'ASC']];

    if (jenis_id == 'All') {
        await db.Lain.findAndCountAll({
            order: sorted,
        }).then(function (data) {
            data.rows.forEach(function (x, i) {
                let kkatch = {}
                kkatch['id'] = x.id;
                kkatch['name'] = x.name;
                obj.push(kkatch);
            });
        });
    } else {
        await db.Lain.findAndCountAll({
            where: {jenis_id: jenis_id}, order: sorted,
        }).then(function (data) {
            data.rows.forEach(function (x, i) {
                let kkatch = {}
                kkatch['id'] = x.id;
                kkatch['name'] = x.name;
                obj.push(kkatch);
            });
        });
    }


    res.send({status: 'OK', data: obj});


});

router.get('/get_resitauto/:alatan_id/:userid', auditTrail.trace, async function (req, res) {
    let alatan_id = req.params.alatan_id;
    let alatan = await db.Alatan.findOne({
        where: {id: alatan_id}
    });
    // console.log(alatan.tahun)

    let user_id = req.params.userid;

    let user = await db.User.findOne({
        where: {id: user_id}
    });

    let branch = await db.Branch.findOne({
        where: {id: user.branch_id}
    });
    let where = {jenisresit: 'Auto'};
    // let branch = await db.User.findAll({attributes: ['id'], where: {codeCawangan: user.branch_id}, raw: true})
    //     .then(data => {
    //         let gengBranch = [];
    //         data.map((item) => {
    //             gengBranch.push(item['id'])
    //         });
    //         return gengBranch;
    //     })
    where['codeCawangan'] = branch.code
    where['tahun'] = alatan.tahun

    console.log(where)

    sorted = [['resit', 'DESC']]
    let cari = await db.Alatan.findOne({
        where: where,
        order: sorted,
    });
    let nomb = 0;
    if (cari) {
        nomb = Number(cari.resit) + 1;
    } else {
        nomb = 1;
    }


    res.send({status: 'OK', data: nomb.toString().padStart(4, "0")});


});

router.get('/get_resitauto_update/:alatan_id/:userid', auditTrail.trace, async function (req, res) {
    let alatan_id = req.params.alatan_id;
    let alatan = await db.Alatan.findOne({
        where: {id: alatan_id}
    });
    // console.log(alatan.tahun)

    let user_id = req.params.userid;

    // let user = await db.User.findOne({
    //     where: {id: user_id}
    // });
    //
    // let branch = await db.Branch.findOne({
    //     where: {id: user.branch_id}
    // });
    let where = {jenisresit: 'Auto'};
    // let branch = await db.User.findAll({attributes: ['id'], where: {codeCawangan: user.branch_id}, raw: true})
    //     .then(data => {
    //         let gengBranch = [];
    //         data.map((item) => {
    //             gengBranch.push(item['id'])
    //         });
    //         return gengBranch;
    //     })
    where['codeCawangan'] = alatan.codeCawangan
    where['tahun'] = alatan.tahun

    // console.log(where)

    sorted = [['resit', 'DESC']]
    let cari = await db.Alatan.findOne({
        where: where,
        order: sorted,
    });
    let nomb = 0;
    if (cari) {
        nomb = Number(cari.resit) + 1;
    } else {
        nomb = 1;
    }

    console.log(alatan_id)
    console.log(nomb.toString().padStart(4, "0"))

    let updateDetailValues = {
        jenisresit: 'Auto',
        resit: nomb.toString().padStart(4, "0")
    }
    await db.Alatan.update(updateDetailValues, {where: {id: alatan_id}})


    res.send({status: 'OK', data: nomb.toString().padStart(4, "0")});


});

router.get('/get_tempatpembaik/:pemilik_id/:userid', auditTrail.trace, async function (req, res) {
    let pemilik_id = req.params.pemilik_id;
    let pemilik = await db.Repairer.findOne({
        where: {id: pemilik_id},
    });


    res.send({
        status: 'OK',
        data: pemilik.address,
    });


});

router.get('/get_tempatpemilik/:pemilik_id/:userid', auditTrail.trace, async function (req, res) {
    let pemilik_id = req.params.pemilik_id;
    let pemilik = await db.Owner.findOne({
        where: {id: pemilik_id},
    });
    let data = {};
    data['data'] = pemilik.address;
    data['agensi'] = pemilik.agency;


    res.send({
        status: 'OK',
        data: data
    });


});

router.get('/get_kategori/:lain_id/:userid', auditTrail.trace, async function (req, res) {
    let lain_id = req.params.lain_id;
    let obj = [];
    sorted = [['no', 'ASC']];

    if (lain_id == 'All') {
        await db.Kategori.findAndCountAll({
            order: sorted,
        }).then(function (data) {
            data.rows.forEach(function (x, i) {
                let kkatch = {}
                kkatch['id'] = x.id;
                kkatch['name'] = x.name;
                kkatch['harga'] = x.harga;
                obj.push(kkatch);
            });
        });
    } else {
        await db.Kategori.findAndCountAll({
            where: {lain_id: lain_id},
            order: sorted,
        }).then(function (data) {
            data.rows.forEach(function (x, i) {
                let kkatch = {}
                kkatch['id'] = x.id;
                kkatch['name'] = x.name;
                obj.push(kkatch);
            });
        });
    }


    res.send({status: 'OK', data: obj});


});

router.get('/get_jenama/:userid', auditTrail.trace, async function (req, res) {
    let lain_id = req.params.lain_id;
    let obj = [];
    sorted = [['name', 'ASC']];

    await db.Jenama.findAndCountAll({
        order: sorted,
    }).then(function (data) {
        data.rows.forEach(function (x, i) {
            let kkatch = {}
            kkatch['value'] = x.id;
            kkatch['label'] = x.name;
            obj.push(kkatch);
        });
    });


    res.send({status: 'OK', data: obj});


});
router.get('/get_harga/:kategori_id/:userid', auditTrail.trace, async function (req, res) {
    let kategori_id = req.params.kategori_id;
    let obj = [];

    let harga = await db.Kategori.findOne({
        where: {id: kategori_id},
    });


    res.send({status: 'OK', data: harga.harga});


});

router.post('/change_password/:userid', auditTrail.trace, async function (request, response) {
    try {
        let user = await db.User.findOne({where: {id: request.params.userid}});
        user.password = request.body.password;
        await user.save();
        response.send({status: 'OK', msg: 'Password updated'})
    } catch (e) {
        response.send({status: 'FAILED', msg: 'An error has occured!'})
    }

});


module.exports = router;
