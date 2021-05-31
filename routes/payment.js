var express = require('express');
var router = express.Router();
let formidable = require('formidable');
var moment = require("moment");
var db = require('../models');
var auditTrail = require('../middleware/auditTraill/index.js');
var authJWT = require("../middleware/auth/index.js")
var request = require("request");

const {Op, where} = require("sequelize");
const { Branch } = require('../models');
const { resolve } = require('promise');

router.use(authJWT.verifyToken);

router.post('/create/:userid' ,auditTrail.trace , function (request, response) {
    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {
        db.Payment.findOne({where: {
            alatan_id: fields.alatandID, is_deleted: 0
        }}).then(el => {
            let tempResit = JSON.parse(fields.pembayaran);
            console.log(tempResit['jenisResit'], "LKKK")

            // console.log(moment(item.tarikh).format("YYYY"))
            db.Alatan.update({
                codeCawangan: tempResit['codekaw']
            }, {where: {id: fields.alatandID}}).then();

            if(el != null){
                db.Payment.update({
                    data: fields.data,
                    rujukanKewangan: fields.pembayaran,
                    jenisBayaran: fields.jenisPembayaran,
                    kutipanBayaran: fields.kutipan,
                    noCek: fields.noCek,
                    nameBank: fields.namaBank,
                    invoiceTo: fields.invoiceTo
                }, {where : {alatan_id: fields.alatandID}}).then(res => {
                    response.send({status:"OK"});
                })
            }else{
                db.Payment.create({
                    alatan_id: fields.alatandID,
                    data: fields.data,
                    rujukanKewangan: fields.pembayaran,
                    jenisBayaran: fields.jenisPembayaran,
                    kutipanBayaran: fields.kutipan,
                    noCek: fields.noCek,
                    nameBank: fields.namaBank,
                    invoiceTo: fields.invoiceTo,
                    noRujukan: fields.noRujukan,
                    is_deleted: 0,
                }).then(res => {
                    response.send({status:"OK"});
                })
            }
        })
        
        
    });
});

router.get('/get_alatan/:alatanid/:userid',auditTrail.trace , async function (req, res) {

    let alatanid = req.params.alatanid;

    let alatan = await db.Alatan.findOne({
        where: {id: alatanid},
    });
    let pegawai = await db.User.findOne({
        where: {id: alatan.user_id},
    });
    let kawasan = await db.Branch.findOne({
        where: {id: pegawai.branch_id},
    });
    let pembaik = await db.Repairer.findOne({
        where: {id: alatan.repairer_id},
    });

    let obj = {};
    if (alatan) {
        obj['date_created'] = moment(alatan.tarikh).format("DD/M/YYYY");
        obj['kawasan'] = kawasan.name;
        obj['kawasan_id'] = kawasan.id;
        obj['kawasan_code'] = kawasan.code;
        obj['kawasan_alamat'] = kawasan.address;
        obj['tempat'] = alatan.tempat;
        obj['jenisResit'] = alatan.jenisresit;
        obj['hantar'] = alatan.ishantar;
        obj['codeCawangan'] = alatan.codeCawangan;
        obj['jenistempat'] = alatan.jenistempat;
        obj['resit'] = alatan.resit;
        obj['pegawai'] = pegawai.name;
        obj['pegawai_id'] = alatan.user_id;
        if (pembaik){
            obj['pembaik'] = pembaik.name;
        }
        else{
            obj['pembaik'] = '';
        }
        // obj['pembaik'] = pembaik.name;
        obj['pembaik_id'] = alatan.repairer_id;
        obj['id'] = alatan.id;

        obj['tahun'] =alatan.tahun;

        db.Detailalatan.findAndCountAll({
            where: {alatan_id: alatan.id},
        }).then( async function (data)  {

            return await Promise.all(data.rows.map( async (x, index)=>{
                let kkatch = {};
                 let kategori = await db.Kategori.findOne({
                    where: {id: x.kategori_id},
                });

                let pemilik = await db.Owner.findOne({
                    where: {id: x.owner_id},
                });

                kkatch['id'] = x.id;
                if (kategori){
                    let lain = await db.Lain.findOne({
                        where: {id: kategori.lain_id},
                    });
                    let jenis = await db.Jenis.findOne({
                        where: {id: lain.jenis_id},
                    });
                    kkatch['kategori'] = kategori.name;
                    kkatch['lain_id'] = lain.id;
                    kkatch['jenis_id'] = jenis.id;
                    kkatch['kategori_id'] = kategori.id;
                    kkatch['lain'] = lain.name;
                    kkatch['jenis'] = jenis.name;
                    kkatch['caj'] = x.caj;
                }
                else{
                    kkatch['kategori'] ='';
                    kkatch['lain_id'] ='';
                    kkatch['jenis_id'] = '';
                    kkatch['kategori_id'] = '';
                    kkatch['lain'] = '';
                    kkatch['jenis'] = '';
                    kkatch['caj'] = '0';
                }

                if (pemilik) {
                    kkatch['usertype'] = 'pemilik'
                    kkatch['pemilik_id'] = x.owner_id;
                    kkatch['pemilik'] = pemilik.name
                } else {
                    kkatch['usertype'] = 'pembaik'
                    kkatch['pemilik_id'] =obj['pembaik_id'];
                    kkatch['pemilik'] = obj['pembaik']
                }
                kkatch['had'] = x.had;
                kkatch['jenishad'] = x.jenishad;
                kkatch['jenama'] = x.jenama;
                kkatch['siri'] = x.siri;
                kkatch['tentusan'] = x.tentusan;
                kkatch['nombordaftar'] = x.nombordaftar;
                kkatch['nomborsijil'] = x.nomborsijil;
                kkatch['stikerbaru'] = x.stikerbaru;
                kkatch['jenisstikerbaru'] = x.jenisstikerbaru;
                kkatch['stikerlama'] = x.stikerlama;
                kkatch['jenisstikerlama'] = x.jenisstikerlama;
                kkatch['lama'] = '1';

                return kkatch;
            }));
        }) 
        .then(async (data) => {
            obj['detail'] = data;

            let payment = await db.Payment.findOne({
                where: {alatan_id: alatanid , is_deleted: 0},
                raw: true
            });
            let vData =[], other= {};
            // console.log(payment);
            if(payment != null){
                vData = JSON.parse(payment['data'])
                other = payment
            }
            // console.log(obj);

            res.send({status: 'OK', data: obj, dataPay: vData, others: other});

            // res.send({status: 'OK', data: obj});
        })
        
    }

});

router.post('/list_manager/:userid', auditTrail.trace, async function (req, res) {

    let username = await db.User.findOne({
        where: {id: req.params.userid}
    });
    let branch = await db.Branch.findOne({
        where: {id: username.branch_id}
    });
   let pageSize = req.body.pageSize;
    let currentPage = req.body.page;
    let where = {isdeleted: false};
    let whereAssign = {};

    // console.log(req.body.branch_id, "LSSS")
    if(req.body.branch_id){
        let branch  = await db.User.findAll({attributes: ['id'],where: {branch_id: req.body.branch_id}, raw: true})
        .then(data => {
            let gengBranch = [];
            data.map((item)=> {
                gengBranch.push(item['id'])
            });
            return gengBranch;
        })

        where['user_id'] = branch
    }


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
                case 'date_created':
                    jj['date_created'] = {[Op.between]: [moment(item.value + ' 00:00:00', 'D/M/YYYY HH:mm:ss'), moment(item.value + ' 23:59:59', 'D/M/YYYY HH:mm:ss')]};
                    resolve(jj);
                case 'pembaik':
                    let vv = await  new Promise(async (resolve, reject)=> {
                        await db.Repairer.findAll({attributes: ['id'],where: {name:{[Op.like]: '%' + item.value + '%'}}, raw: true})
                        .then(data => {
                            let gengBranch = [];
                            data.map((item)=> {
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

    bb.map((item)=>{
        if ("repairer_id" in item){
            where['repairer_id'] = item['repairer_id']
        }
        else if ("resit" in item){
            where['resit'] = item['resit']
        }
        else if ("tempat" in item){
            where['tempat'] = item['tempat']
        }
        else if ("tarikh" in item){
            where['tarikh'] = item['tarikh']
        }

    });

    let sorted = [];
    sorted = [['tarikh', 'DESC']]
    let alatan = await db.Alatan.findAndCountAll({
        raw: true,
        where: where,
        order: sorted,
        limit: pageSize,
        offset: currentPage * pageSize,
    }).then(async(el) => {
        let res =  await Promise.all(el.rows.map(async (item , index)=> {
            let obj = {};
            let pembaik =await db.Repairer.findOne({
                where: {id: item.repairer_id},
            });
            let payment = await db.Payment.findOne({
                where: {alatan_id: item.id,is_deleted: false},
            });
            if (pembaik){
                obj['pembaik'] = pembaik.name;
            }
            obj['id'] = item.id;
            obj['tarikh'] = moment(item.tarikh).format("DD/M/YYYY");
            obj['date_created'] = moment(item.tarikh).format("DD/M/YYYY hh:mm");
            if (payment){
                if (item.jenisresit == 'Auto') {
                    obj['resit'] = 'DMSB/' + item.codeCawangan + '/' + item.resit;
                } else {
                    obj['resit'] = item.resit;
                }
            }
            else{
                obj['resit'] = '';
            }

            // if (item.jenisresit == 'Auto'){
            //     obj['resit'] = 'DMSB/' + item.codeCawangan + '/' + item.resit;
            // }
            // else{
            //     obj['resit'] = item.resit;
            // }
            obj['tahun'] =item.tahun;
            obj['tempat'] =item.tempat;
            obj['hantar'] =0;
            obj['payment'] = item.ishantar;
            return obj
        }))
        
        return ({count: Math.ceil(el.count / pageSize), status: 'OK', data: res})
    })
   
    res.send(alatan)
});

router.post('/list_manager_negeri/:userid', auditTrail.trace, async function (req, res) {

    let username = await db.User.findOne({
        where: {id: req.params.userid}
    });
    let branch = await db.Branch.findOne({
        where: {id: username.branch_id}
    });
   let pageSize = req.body.pageSize;
    let currentPage = req.body.page;
    let where = {isdeleted: false};
    let where2 = {};
    let whereAssign = {};

    if(req.body.branch_id){
        let allbranc  = await db.Branch.findAll({attributes: ['id'],where: {state: branch.state}, raw: true})
        .then(data => {
            let totalbrcn = [];
            data.map((item)=> {
                totalbrcn.push(item['id'])
            });
            return totalbrcn;
        })

        where2['branch_id'] = allbranc
    }

    if(req.body.branch_id){
        let branch  = await db.User.findAll({attributes: ['id'],where: where2, raw: true})
        .then(data => {
            let gengBranch = [];
            data.map((item)=> {
                gengBranch.push(item['id'])
            });
            return gengBranch;
        })

        where['user_id'] = branch
    }

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
                // case 'date_created':
                //     jj['date_created'] = {[Op.between]: [moment(item.value + ' 00:00:00', 'D/M/YYYY HH:mm:ss'), moment(item.value + ' 23:59:59', 'D/M/YYYY HH:mm:ss')]};
                    resolve(jj);
                case 'pembaik':
                    let vv = await  new Promise(async (resolve, reject)=> {
                        await db.Repairer.findAll({attributes: ['id'],where: {name:{[Op.like]: '%' + item.value + '%'}}, raw: true})
                        .then(data => {
                            let gengBranch = [];
                            data.map((item)=> {
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


    bb.map((item)=>{
        if ("repairer_id" in item){
            where['repairer_id'] = item['repairer_id']
        }
        else if ("resit" in item){
            where['resit'] = item['resit']
        }
        else if ("tempat" in item){
            where['tempat'] = item['tempat']
        }
        else if ("tarikh" in item){
            where['tarikh'] = item['tarikh']
        }

    });

    let sorted = [];
    sorted = [['tarikh', 'DESC']]
    let alatan = await db.Alatan.findAndCountAll({
        raw: true,
        where: where,
        order: sorted,
        limit: pageSize,
        offset: currentPage * pageSize,
    }).then(async(el) => {
        let res =  await Promise.all(el.rows.map(async (item , index)=> {
                let obj = {};
                let pembaik =await db.Repairer.findOne({
                    where: {id: item.repairer_id},
                });
                let payment = await db.Payment.findOne({
                    where: {alatan_id: item.id,is_deleted: false},
                });
                if (pembaik){
                    obj['pembaik'] = pembaik.name;
                }
                if (payment){
                    if (item.jenisresit == 'Auto') {
                        obj['resit'] = 'DMSB/' + item.codeCawangan + '/' + item.resit;
                    } else {
                        obj['resit'] = item.resit;
                    }
                }
                else{
                    obj['resit'] = '';
                }
                obj['id'] = item.id;
                obj['tarikh'] = moment(item.tarikh).format("DD/M/YYYY hh:mm");
                obj['date_created'] = moment(item.tarikh).format("DD/M/YYYY");
                // if (item.jenisresit == 'Auto'){
                //     obj['resit'] = 'DMSB/' + item.codeCawangan + '/' + item.resit;
                // }
                // else{
                //     obj['resit'] = item.resit;
                // }
                obj['tempat'] =item.tempat
                obj['hantar'] =0;
                obj['payment'] = item.ishantar;
                return obj
        }))

        return ({count: Math.ceil(el.count / pageSize), status: 'OK', data: res})
    })

    res.send(alatan)
});

router.get('/set_all_cedocawagnan',auditTrail.trace , async function (req, res) {

    db.Alatan.findAndCountAll({
        where: {codeCawangan: ''},
    }).then( async function (data)  {
        return await Promise.all(data.rows.map( async (x, index)=>{
            let user = await db.User.findOne({
                where: {id: x.user_id}
            });
            let kawas = await db.Branch.findOne({
                where: {id: user.branch_id}
            });
            db.Alatan.update({
                codeCawangan: kawas.code
            }, {where: {id: x.id}})

            return 'Done';
        }));

    })
    return 'ok2'
});

router.get('check_sticker_no', async function (req, res) {

    form.parse(request, async function (err, fields, files) {
        db.Alatan.findOne({where: {
            stikerbaru: fields.stickerbaru,
            jenisstikerbaru: fields.jenisstikerbaru
        }}).then(el => {
            if(el != null){
                res.send("OK")
            }else{
                res.send("Exist")
            }
        })
    });
});

router.get('/get_alamat/:id', async function(req, res) {
    
    let idTemp = req.params.id;
    let repairer = await db.Repairer.findOne({
        where: {id: idTemp}
    })

    if(repairer == null){
        let owner = await db.Owner.findOne({
            where: {id: idTemp}
        })

        if(owner == null){
            res.send({status: 'Failed'});
        }else{
            let info = owner.toJSON();
            res.send({status: 'OK', alamat : info.address, codeID: "-"})
        }
    }else{
        let info = repairer.toJSON();
        res.send({status: 'OK', alamat : info.address, codeID: info.codeid})
    }
});

router.get('/get_jenispembayaran/:id', async function(req, res) {

    let idTemp = req.params.id;
    let repairer = await db.Repairer.findOne({
        where: {id: idTemp}
    });
    let owner = await db.Owner.findOne({
        where: {id: idTemp}
    });

    if(repairer == null){
        if(owner == null){
            res.send({status: 'OK', jenis : ''})
        }
        else{
            let infox = owner.toJSON();
            res.send({status: 'OK', jenis : infox.statusBayaran})
        }

    }else{
        let info = repairer.toJSON();
        res.send({status: 'OK', jenis : info.statusBayaran})
    }
});


router.post('/carian', async function(request, res) {
    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {
        let whereS = {};
        let rodeStatus = false;
        if (Object.entries(fields.jenisSticker).length > 0) {
            whereS.jenisstikerbaru = {
                [Op.like]: '%' + fields.jenisSticker + '%'
            }
            rodeStatus = true;
        }

        if (Object.entries(fields.nomborStiker).length > 0) {
            whereS.stikerbaru = {
                [Op.like]: '%' + fields.nomborStiker + '%'
            }
            rodeStatus = true;
        }

        if (Object.entries(fields.nomborDaftar).length > 0) {
            whereS.nombordaftar = {
                [Op.like]: '%' + fields.nomborDaftar + '%'
            }
            rodeStatus = true;
        }

        if (Object.entries(fields.pegawaitentusah_id).length > 0) {
            whereS.user_id =  fields.pegawaitentusah_id
            //     [Op.like]: '%' + fields.pegawaitentusah_id + '%'
            // }
            rodeStatus = true;
        }

        if (Object.entries(fields.nomborSijil).length > 0) {
            whereS.nomborsijil = {
                [Op.like]: '%' + fields.nomborSijil + '%'
            }
            rodeStatus = true;
        }   
        let whreResit = {};

        if (Object.entries(fields.nomborResit).length > 0) {
            whreResit.resit =  { [Op.like]: '%' + fields.nomborResit + '%'};
            rodeStatus = true;
        }
        sorted = [['stikerbaru', 'ASC']];
        
        if(rodeStatus){
            let data = await db.Detailalatan.findAll({
                where: whereS,order: sorted,
                limit: 40,
                include: [
                    {model: db.Alatan, as: 'alatan', where: whreResit, include: [{model: db.Repairer, as: 'repairer', attributes: ['name','address']}
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
                    item['code_kawasan'] = pegawai.branch.code;
                    item['cawangan'] = pegawai.branch.regional;
                    item['pegawai_name'] = pegawai.name;

                    return item;
                })
            )
            
            res.send({status: 'OK' , data: vData})

        }else{
            res.send({status: 'OK' , data: []})
        }

        
        
    });
    
    
});

router.get('/void_payment/:alatan_id/:userid',auditTrail.trace, async function(req, res) {
    let alatan_id = req.params.alatan_id;
    
    // let alt = db.Alatan.update({
    //     resit: '', jenisresit: ''
    // }, { where : {id: alatan_id}})
    
    let pay = db.Payment.update({
        is_deleted: 1
    }, { where : {
        alatan_id: alatan_id, is_deleted: 0
    }})  

    Promise.allSettled([alt, pay])
    .then( _ => {
        res.send({status: 'OK'})
    })
});

var request = require("request");

router.get('/create_invoice_bukku', async function(req, res) {
    let payment = await db.Payment.findAll({where: {isBukku : '0'}, raw: true});
    let result = [];
    Promise.all(
        payment.map(item , index => {
            const dataTemp = {
                "invoices": [
                        {
                            "contact_name" : "Cash Sales",
                            "date" : "2019-08-24",
                            "currency_code": "MYR",
                            "exchange_rate": 1,
                            "tax_mode" : "inclusive",
                            "payment_account_code": "3300-101", 
                            "items": [
                                {
                                    "account_code": "5100-200",
                                    "description": "TEST",
                                    "quantity": 1,
                                    "unit_price": 12,
                                    "discount" : "20.00",
                                    "tax_code": "SV6"
                                }
                            ],
                            "status": "ready"	
                        }
                    ]	
            };
        })
    )
    // console.log(payment)
    

    // const options = {
    //     uri: "https://cooper-api.bukku.my/dmsb/batch_cash_invoices",
    //     method: 'POST',
    //     headers: {
    //         "Content-Type" : "application/json",
    //         "Authorization" : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvY29vcGVyLWFwaS5idWtrdS5teVwvc2V0dGluZ3NcL2FwaSIsImlhdCI6MTYwNDUzODQxMiwibmJmIjoxNjA0NTM4NDEyLCJqdGkiOiJGQ1FTQ3FVbWkwWUV4Y1drIiwic3ViIjoxMDQsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.MfccNlGSVnyolh0nkkFCptd2oaH4qSPeacnbE5pkc0c",
    //         "Company-Subdomain" : "edata",
    //         "Accept" : "application/json"
    //     },
    //     body: JSON.stringify(dataTemp),
    // }

    // request(options , function(err, resBukku, bodyBuku){
    //     if (!err && resBukku.statusCode == 200) {
    //         const info = JSON.parse(bodyBuku);
    //         console.log(info);
    //       }
        
    //     console.error('error:', err); // Print the error if one occurred
    //     console.log('statusCode:', resBukku && resBukku.statusCode); // Print the response status code if a response was received
    //     console.log('body:', bodyBuku); // Print the HTML for the Google homepage.

    //     res.send('OK')
    // })
});

module.exports = router;