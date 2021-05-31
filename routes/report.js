const db = require('../models');
const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const {Op} = require("sequelize");
const nodemailer = require('nodemailer');
const auditTrail = require('../middleware/auditTraill/index.js');
var moment = require('moment');

const env = require('../config/config')['environment'];
const config = require('../config/config')[env];
const mv = require('mv');
var authJWT = require("../middleware/auth/index.js")

router.use(authJWT.verifyToken);

router.get('/find_daily_report', async function (req, res) {
    let tarikh = moment(req.query.tarikh, "MM/DD/YYYY").format("YYYY-MM-DD");
    let fromDate = tarikh + ' 00:00:00';
    let toDate = tarikh + ' 23:59:59';

    let queryLokasi = {[Op.ne]: null};

    if (req.query.lokasi === 'luar') {
        queryLokasi = {[Op.eq]: 'Premis Pelanggan'};
    } else if (req.query.lokasi === 'dalam') {
        queryLokasi = {[Op.eq]: 'Pejabat Cawangan'};
    } else if (req.query.lokasi === 'stampingStation') {
        queryLokasi = {[Op.eq]: 'Stamping Station'};
    }

    let branchxxx = await db.Branch.findOne({
        where: {id: req.query.cawangan},
    });

    let paymentArr = [];
    let alatanArr = [];
    await db.Alatan.findAll({
        where: {
            tarikh: {
                [Op.between]: [fromDate, toDate],
            },
            jenisTempat: queryLokasi,
            isdeleted: 0,
            ishantar: 1,
            [Op.and]: [
                {resit: {[Op.ne]: ''}},
                {resit: {[Op.ne]: null}}
            ]
        },
        include: [
            {model: db.User, as: 'user'},
            {model: db.Repairer, as: 'repairer'},
        ]
    }).then(async function (data) {

        for (const alatan of data) {
            if (alatan.codeCawangan === branchxxx.code) {
                // let getData = await funcGetData(alatan, paymentArr, alatanArr, jumlahBelumDibayar, jumlahSudahDibayar);
                // paymentArr = getData['paymentArr'];
                // alatanArr = getData['alatanArr'];
                // jumlahBelumDibayar = getData['jumlahBelumDibayar'];
                // jumlahSudahDibayar = getData['jumlahSudahDibayar'];
                let detailAlatan = await db.Detailalatan.findAll({
                    where: {
                        alatan_id: alatan.id,
                    },
                    include: [
                        {model: db.User, as: 'user'},
                        {model: db.Owner, as: 'owner'},
                        {model: db.Kategori, as: 'kategori'},
                    ]
                });
                let payment = await db.Payment.findOne({where: {alatan_id: alatan.id, is_deleted: 0}});
                if (payment) {
                    let paymentObj = {};
                    let pembayar = null;
                    try {
                        pembayar = JSON.parse(payment.invoiceTo).name;
                    } catch (e) {
                        pembayar = payment.invoiceTo;
                    }
                    paymentObj = {
                        "resit": alatan.resit,
                        "noRujukan": payment.noRujukan,
                        "pembayar": pembayar,
                        "pegawai": alatan.user.name,
                        "data": JSON.parse(payment.data),
                        "jenisBayaran": payment.jenisBayaran ? payment.jenisBayaran : 0,
                        "kutipanBayaran": JSON.parse(payment.kutipanBayaran),
                        "jenisResit": alatan.jenisresit,
                        "branchCode": alatan.codeCawangan
                    };
                    paymentArr.push(paymentObj)

                    for (const detail of detailAlatan) {
                        let alatanObj = {};
                        let pemilik = await db.Owner.findOne({where: {id: detail.owner_id}});

                        if (alatan.repairer || detail.owner) {
                            alatanObj['pembaik'] = alatan.repairer ? alatan.repairer.name : null;
                            alatanObj['pemilik'] = detail.owner ? detail.owner.name : alatan.repairer ? alatan.repairer.name : null;
                            alatanObj['alamatPemilik'] = pemilik ? pemilik.address : alatan.repairer ? alatan.repairer.address : null;
                            alatanObj['jenama'] = detail.jenama;
                            if (detail.kategori_id !== null) {
                                let lain = await db.Lain.findOne({where: {id: detail.kategori.lain_id}});
                                alatanObj['jenis'] = lain.name;
                            } else {
                                alatanObj['jenis'] = '';
                            }
                            alatanObj['had'] = detail.had + ' ' + detail.jenishad;
                            alatanObj['siriAlat'] = detail.siri;
                            alatanObj['rujukan'] = detail.nombordaftar;
                            alatanObj['stiker'] = detail.stikerbaru;
                            alatanObj['jenisStiker'] = detail.jenisstikerbaru;
                            alatanObj['sijil'] = detail.nomborsijil;
                            alatanObj['tentusahan'] = detail.tentusan;
                            alatanObj['pegawai'] = detail.user.name;
                            alatanObj['invois'] = alatan.resit;
                            alatanObj['fiAlat'] = detail.caj;
                            alatanArr.push(alatanObj)
                        }
                    }
                }
            }
        }

    });
    res.send({"laporan": alatanArr, "payment": paymentArr})
});

router.get('/find_monthly_report', async function (req, res) {
    let dateParam = new Date(req.query.tarikh);
    let month = ('0' + (dateParam.getMonth() + 1)).slice(-2);
    let year = dateParam.getFullYear();
    let dayInMonth = new Date(year, month, 0).getDate();
    let fromDate = year + '-' + month + '-01 00:00:00';
    let toDate = year + '-' + month + '-' + dayInMonth + ' 23:59:59';

    let queryLokasi = {[Op.ne]: null};
    if (req.query.lokasi === 'luar') {
        queryLokasi = {[Op.eq]: 'Premis Pelanggan'};
    } else if (req.query.lokasi === 'dalam') {
        queryLokasi = {[Op.eq]: 'Pejabat Cawangan'};
    } else if (req.query.lokasi === 'stampingStation') {
        queryLokasi = {[Op.eq]: 'Stamping Station'};
    }


    let branchxxx = await db.Branch.findOne({
        where: {id: req.query.cawangan},
    });


    let paymentArr = [];
    let alatanArr = [];
    let jumlahKutipanObj = {};
    let jumlahSudahDibayar = 0;
    let jumlahBelumDibayar = 0;
    let output = {};
    let allAlatan = [];
    await db.Alatan.findAll({
        where: {
            tarikh: {
                [Op.between]: [fromDate, toDate],
            },
            jenisTempat: queryLokasi,
            isdeleted: 0,
            ishantar: 1,
            [Op.and]: [
                {resit: {[Op.ne]: ''}},
                {resit: {[Op.ne]: null}}
            ]
        },
        include: [
            {model: db.User, as: 'user'},
            {model: db.Repairer, as: 'repairer'},
        ]
    }).then(async function (data) {
        allAlatan = data;
        for (const alatan of data) {



            if (req.query.cawangan === 'all') {
                let getData = await funcGetData(alatan, paymentArr, alatanArr, jumlahBelumDibayar, jumlahSudahDibayar);
                paymentArr = getData['paymentArr'];
                alatanArr = getData['alatanArr'];
                jumlahBelumDibayar = getData['jumlahBelumDibayar'];
                jumlahSudahDibayar = getData['jumlahSudahDibayar'];
            } else if (branchxxx) {
                if (alatan.codeCawangan === branchxxx.code) {

                    let getData = await funcGetData(alatan, paymentArr, alatanArr, jumlahBelumDibayar, jumlahSudahDibayar);
                    paymentArr = getData['paymentArr'];
                    alatanArr = getData['alatanArr'];
                    jumlahBelumDibayar = getData['jumlahBelumDibayar'];
                    jumlahSudahDibayar = getData['jumlahSudahDibayar'];
                }
            }

        }

        function groupBy(a, keyFunction) {
            const groups = {};
            a.forEach(function (el) {
                const key = keyFunction(el);
                if (!(key in groups)) {
                    groups[key] = [];
                }
                groups[key].push(el);
            });
            return groups;
        }

        const byName = groupBy(alatanArr.filter(it => it.jenisAlat), it => it['jenisAlat'])
        output = Object.keys(byName).map(name => {
            const status = groupBy(byName[name], it => it.gagal);
            const sumBerjaya = byName[name].reduce((acc, it) => acc + it.cajBerjaya, 0);
            const sumGagal = byName[name].reduce((acc, it) => acc + it.cajGagal, 0);
            let idAlat = groupBy(byName[name], it => it.idAlat)
            return {
                'idAlat': Object.keys(idAlat)[0],
                'jenisAlat': name,
                'bilanganAlatBerjaya': status.false ? status.false.length : 0,
                'kutipanFiBerjaya': sumBerjaya,
                'bilanganAlatGagal': status.true ? status.true.length : 0,
                'kutipanFiGagal': sumGagal,
            }
        });

        jumlahKutipanObj = {
            "jumlahSudahDibayar": jumlahSudahDibayar.toFixed(2),
            "jumlahBelumDibayar": jumlahBelumDibayar.toFixed(2),
            "jumlahSemua": (jumlahSudahDibayar + jumlahBelumDibayar).toFixed(2)
        };
    });

    let resultArr = []
    let jenis = await db.Jenis.findAll();
    for (const j of jenis) {
        let jenisObj = {}
        let lain = await db.Lain.findAll({
            where: {jenis_id: j.id},
            include: [
                {model: db.Jenis, as: 'jenis'},
            ]
        });
        let lainArr = [];
        for (const l of lain) {
            lainArr.push(l.id)
        }

        let kategori = await db.Kategori.findAll({
            where: {
                lain_id: {
                    [Op.in]: lainArr,
                },
            },
        });
        let catArr = [];
        for (const cat of kategori) {
            catArr.push(cat.id)
        }


        let alatanArr = [];
        for (const alat of allAlatan) {
            if (alat.user.branch_id === req.query.cawangan) {
                alatanArr.push(alat.id)
            }
        }

        let countJenis = 0;
        let fiPenentusahan = 0;
        let detailAlatan = await db.Detailalatan.findAll({
            where: {
                alatan_id: {
                    [Op.in]: alatanArr,
                },
                kategori_id: {
                    [Op.in]: catArr,
                },
            },
            include: [
                {model: db.User, as: 'user'},
                {model: db.Owner, as: 'owner'},
                {model: db.Kategori, as: 'kategori'},
            ]
        });

        for (const detail of detailAlatan) {
            countJenis += 1;
            if (isNaN(parseFloat(detail.caj))) {
                fiPenentusahan += 0
            } else {
                fiPenentusahan += parseFloat(detail.caj);
            }
        }
        jenisObj['kategoriAlat'] = j.name;
        jenisObj['jumlahAlat'] = countJenis;
        jenisObj['jumlahFiPenentusahan'] = fiPenentusahan;
        resultArr.push(jenisObj)
    }
    res.send({"laporan": output, "payment": paymentArr, "jumlahKutipan": jumlahKutipanObj, 'serapan': resultArr})
});

router.get('/find_yearly_report', async function (req, res) {
    req.setTimeout(300000); // value in ms = 5 minutes
    let dateParam = new Date(req.query.tarikh);
    let year = dateParam.getFullYear();
    let fromDate = year + '-01-01 00:00:00';
    let toDate = year + '-12-31 23:59:59';

    let queryLokasi = {[Op.ne]: null};
    if (req.query.lokasi === 'luar') {
        queryLokasi = {[Op.eq]: 'Premis Pelanggan'};
    } else if (req.query.lokasi === 'dalam') {
        queryLokasi = {[Op.eq]: 'Pejabat Cawangan'};
    } else if (req.query.lokasi === 'stampingStation') {
        queryLokasi = {[Op.eq]: 'Stamping Station'};
    }

    let branchxxx = await db.Branch.findOne({
        where: {id: req.query.cawangan},
    });

    let paymentArr = [];
    let alatanArr = [];
    let jumlahKutipanObj = {};
    let jumlahSudahDibayar = 0;
    let jumlahBelumDibayar = 0;
    await db.Alatan.findAll({
        where: {
            tarikh: {
                [Op.between]: [fromDate, toDate],
            },
            jenisTempat: queryLokasi,
            isdeleted: 0,
            ishantar: 1,
            [Op.and]: [
                {resit: {[Op.ne]: ''}},
                {resit: {[Op.ne]: null}}
            ]
        },
        include: [
            {model: db.User, as: 'user'},
            {model: db.Repairer, as: 'repairer'},
        ]
    }).then(async function (data) {

        for (const alatan of data) {
            let paymentObj = {};

            if (req.query.cawangan === 'all') {
                let getData = await funcGetData(alatan, paymentArr, alatanArr, jumlahBelumDibayar, jumlahSudahDibayar);
                paymentArr = getData['paymentArr'];
                alatanArr = getData['alatanArr'];
                jumlahBelumDibayar = getData['jumlahBelumDibayar'];
                jumlahSudahDibayar = getData['jumlahSudahDibayar'];
            } else if (branchxxx) {
                if (alatan.codeCawangan === branchxxx.code) {

                    let getData = await funcGetData(alatan, paymentArr, alatanArr, jumlahBelumDibayar, jumlahSudahDibayar);
                    paymentArr = getData['paymentArr'];
                    alatanArr = getData['alatanArr'];
                    jumlahBelumDibayar = getData['jumlahBelumDibayar'];
                    jumlahSudahDibayar = getData['jumlahSudahDibayar'];
                }
            }
        }

        function groupBy(a, keyFunction) {
            const groups = {};
            a.forEach(function (el) {
                const key = keyFunction(el);
                if (!(key in groups)) {
                    groups[key] = [];
                }
                groups[key].push(el);
            });
            return groups;
        }

        const byName = groupBy(alatanArr.filter(it => it.jenisAlat), it => it['jenisAlat'])
        const output = Object.keys(byName).map(name => {
            const status = groupBy(byName[name], it => it.gagal);
            const sumBerjaya = byName[name].reduce((acc, it) => acc + it.cajBerjaya, 0);
            const sumGagal = byName[name].reduce((acc, it) => acc + it.cajGagal, 0);
            let idAlat = groupBy(byName[name], it => it.idAlat)
            return {
                'idAlat': Object.keys(idAlat)[0],
                'jenisAlat': name,
                'bilanganAlatBerjaya': status.false ? status.false.length : 0,
                'kutipanFiBerjaya': sumBerjaya,
                'bilanganAlatGagal': status.true ? status.true.length : 0,
                'kutipanFiGagal': sumGagal,
            }
        });

        jumlahKutipanObj = {
            "jumlahSudahDibayar": jumlahSudahDibayar.toFixed(2),
            "jumlahBelumDibayar": jumlahBelumDibayar.toFixed(2),
            "jumlahSemua": (jumlahSudahDibayar + jumlahBelumDibayar).toFixed(2)
        };
        res.send({"laporan": output, "payment": paymentArr, "jumlahKutipan": jumlahKutipanObj})
    });
});

router.get('/find_alatan_report', async function (req, res) {

    let dateParam = new Date(req.query.year);
    let year = dateParam.getFullYear();
    let fromDate;
    let toDate;
    if (req.query.month !== 'All') {
        let month = ('0' + (req.query.month)).slice(-2);
        let dayInMonth = new Date(year, month, 0).getDate();
        fromDate = year + '-' + month + '-01 00:00:00';
        toDate = year + '-' + month + '-' + dayInMonth + ' 23:59:59';
    } else {
        fromDate = year + '-01-01 00:00:00';
        toDate = year + '-12-31 23:59:59';
    }


    let queryLokasi = {[Op.ne]: null};
    if (req.query.lokasi === 'luar') {
        queryLokasi = {[Op.eq]: 'Premis Pelanggan'};
    } else if (req.query.lokasi === 'dalam') {
        queryLokasi = {[Op.eq]: 'Pejabat Cawangan'};
    } else if (req.query.lokasi === 'stampingStation') {
        queryLokasi = {[Op.eq]: 'Stamping Station'};
    }

    let resultArr = [];
    let jenis = await db.Jenis.findOne({where: {id: req.query.jenis}});
    let lain = await db.Lain.findAll({
        where: {jenis_id: jenis.id},
        include: [
            {model: db.Jenis, as: 'jenis'},
        ]
    });
    let lainArr = [];
    for (const l of lain) {
        lainArr.push(l.id)
    }

    let kategori = await db.Kategori.findAll({
        where: {
            lain_id: {
                [Op.in]: lainArr,
            },
        },
    });
    let catArr = [];
    for (const cat of kategori) {
        catArr.push(cat.id)
    }

    let alatan = await db.Alatan.findAll({
        where: {
            tarikh: {
                [Op.between]: [fromDate, toDate],
            },
            jenisTempat: queryLokasi,
            isdeleted: 0,
            ishantar: 1
        },
        include: [
            {model: db.User, as: 'user'},
            {model: db.Repairer, as: 'repairer'},
        ]
    });
    let alatanArr = [];
    for (const alat of alatan) {
        let user = await db.User.findOne({where: {id: alat.user_id}});
        if (user) {
            if (user.branch_id === req.query.cawangan) {
                alatanArr.push(alat.id)
            }
        }
    }

    let detailAlatan = await db.Detailalatan.findAll({
        where: {
            alatan_id: {
                [Op.in]: alatanArr,
            },
            kategori_id: {
                [Op.in]: catArr,
            },
        },
        include: [
            {model: db.User, as: 'user'},
            {model: db.Owner, as: 'owner'},
            {model: db.Kategori, as: 'kategori'},
            {
                model: db.Alatan, as: 'alatan', include: [
                    {model: db.Repairer, as: 'repairer'},
                ]
            },
        ]
    });

    for (const detail of detailAlatan) {
        let alatanObj = {};
        let pemilik = await db.Owner.findOne({where: {id: detail.owner_id}});
        let lain = await db.Lain.findOne({where: {id: detail.kategori.lain_id}});

        alatanObj['tarikh'] = detail.alatan.tarikh;
        alatanObj['pembaik'] = detail.alatan.repairer ? detail.alatan.repairer.name : '';
        alatanObj['pemilik'] = detail.owner ? detail.owner.name : detail.alatan.repairer ? detail.alatan.repairer.name : null;
        alatanObj['alamatPemilik'] = pemilik ? pemilik.address : detail.alatan.repairer ? detail.alatan.repairer.address : null;
        alatanObj['jenama'] = detail.jenama;
        alatanObj['jenis'] = lain.name;
        alatanObj['had'] = detail.had + ' ' + detail.jenishad;
        alatanObj['siriAlat'] = detail.siri;
        alatanObj['rujukan'] = detail.nombordaftar;
        alatanObj['stiker'] = detail.stikerbaru;
        alatanObj['sijil'] = detail.nomborsijil;
        alatanObj['tentusahan'] = detail.tentusan;
        alatanObj['pegawai'] = detail.user.name;
        alatanObj['invois'] = detail.alatan.resit;
        alatanObj['fiAlat'] = detail.caj;
        resultArr.push(alatanObj)
    }
    res.send({"laporan": resultArr})
});

router.get('/find_serapan', async function (req, res) {

    let dateParam = new Date(req.query.tarikh);
    let year = dateParam.getFullYear();
    let fromDate;
    let toDate;
    if (req.query.month !== 'All') {
        let month = ('0' + (req.query.month)).slice(-2);
        let dayInMonth = new Date(year, month, 0).getDate();
        fromDate = year + '-' + month + '-01 00:00:00';
        toDate = year + '-' + month + '-' + dayInMonth + ' 23:59:59';
    } else {
        fromDate = year + '-01-01 00:00:00';
        toDate = year + '-12-31 23:59:59';
    }


    let resultArr = [];

    let queryRepairer = {[Op.ne]: null};
    if (req.query.repairer !== 'Semua') {
        queryRepairer = {[Op.eq]: req.query.repairer};
    }
    let branchx = await db.Branch.findOne({
        where: {id: req.query.branch},
    });

    let jenis = await db.Jenis.findAll();
    for (const j of jenis) {
        let jenisObj = {};
        let lain = await db.Lain.findAll({
            where: {jenis_id: j.id},
            include: [
                {model: db.Jenis, as: 'jenis'},
            ]
        });
        let lainArr = [];
        for (const l of lain) {
            lainArr.push(l.id)
        }

        let kategori = await db.Kategori.findAll({
            where: {
                lain_id: {
                    [Op.in]: lainArr,
                },
            },
        });
        let catArr = [];
        for (const cat of kategori) {
            catArr.push(cat.id)
        }

        let alatan = await db.Alatan.findAll({
            where: {
                tarikh: {
                    [Op.between]: [fromDate, toDate],
                },
                isdeleted: 0,
                ishantar: 1,
                repairer_id: queryRepairer
            },
            include: [
                {model: db.User, as: 'user'},
                {model: db.Repairer, as: 'repairer'},
            ]
        });

        let alatanArr = [];
        for (const alat of alatan) {
            if (req.query.branch === 'Semua') {
                alatanArr.push(alat.id)
            } else {
                if (alat.codeCawangan === branchx.code) {
                    alatanArr.push(alat.id)
                }
            }
        }

        let countJenis = 0;
        let fiPenentusahan = 0;
        let detailAlatan = await db.Detailalatan.findAll({
            where: {
                alatan_id: {
                    [Op.in]: alatanArr,
                },
                kategori_id: {
                    [Op.in]: catArr,
                },
            },
            include: [
                {model: db.User, as: 'user'},
                {model: db.Owner, as: 'owner'},
                {model: db.Kategori, as: 'kategori'},
            ]
        });

        for (const detail of detailAlatan) {
            countJenis += 1;
            if (isNaN(parseFloat(detail.caj))) {
                fiPenentusahan += 0
            } else {
                fiPenentusahan += parseFloat(detail.caj);
            }
        }
        jenisObj['kategoriAlat'] = j.name;
        jenisObj['jumlahAlat'] = countJenis;
        jenisObj['jumlahFiPenentusahan'] = fiPenentusahan;
        resultArr.push(jenisObj)
    }
    res.send({"laporan": resultArr})
});

router.get('/get-jenis', async function (req, res) {
    let jenis = await db.Jenis.findAll()
    res.send(jenis)
});

router.get('/get-lain', async function (req, res) {
    let lain = await db.Lain.findAll()
    res.send(lain)
});

router.get('/get-kategori', async function (req, res) {
    let kategori = await db.Kategori.findAll()
    res.send(kategori)
});

router.get('/get-cawangan/:userid', async function (req, res) {

    let user = await db.User.findOne({
        where: {id: req.params.userid},
        include: [
            {model: db.Branch, as: 'branch'},
            {model: db.Position, as: 'position'},
        ]
    });

    let condition;
    if (user.position.name === 'Manager Cawangan') {
        condition = {code: {[Op.eq]: user.branch.code}}
    } else if (user.position.name === 'Staf') {
        condition = {code: {[Op.eq]: user.branch.code}}
    } else if (user.position.name === 'Manager Negeri') {
        condition = {state: {[Op.eq]: user.branch.state}}
    } else {
        condition = {id: {[Op.ne]: null}}
    }

    let branch = await db.Branch.findAll({where: condition, order: [['code', 'ASC']]});
    let arrResult = []
    for (const data of branch) {
        let obj = {}
        obj['id'] = data.id
        obj['code'] = data.code
        obj['kawasan'] = data.regional
        arrResult.push(obj)
    }
    res.send(arrResult)
});

router.get('/get-pembaik/:userid', async function (req, res) {
    let pembaik = await db.Repairer.findAll({order: [['name', 'ASC']]});
    res.send(pembaik)
});


router.get('/testprint', async function (req, res) {
    let p = path.join(__dirname, '../public', 'SamplePDFFile_5mb.pdf')
    res.sendFile(p);
});

module.exports = router;

async function funcGetData(alatan, paymentArr, alatanArr, jumlahBelumDibayar, jumlahSudahDibayar) {
    let detailAlatan = await db.Detailalatan.findAll({
        where: {
            alatan_id: alatan.id
        },
        include: [
            {model: db.User, as: 'user'},
            {model: db.Owner, as: 'owner'},
            {model: db.Kategori, as: 'kategori'},
        ]
    });
    let payment = await db.Payment.findOne({where: {alatan_id: alatan.id, is_deleted: 0}});

    if (payment) {
        let paymentObj = {};
        let pembayar;
        try {
            pembayar = JSON.parse(payment.invoiceTo).name;
        } catch (e) {
            pembayar = payment.invoiceTo;
        }

        paymentObj = {
            "resit": alatan.resit,
            "noRujukan": payment.noRujukan,
            "pembayar": pembayar,
            "pegawai": alatan.user.name,
            "data": JSON.parse(payment.data),
            "jenisBayaran": payment.jenisBayaran ? payment.jenisBayaran : 0,
            "kutipanBayaran": JSON.parse(payment.kutipanBayaran),
            "jenisResit": alatan.jenisresit,
            "branchCode": alatan.codeCawangan
        };
        paymentArr.push(paymentObj)

        for (const detail of detailAlatan) {
            let alatanObj = {};
            if (detail.kategori_id !== null) {
                let lain = await db.Lain.findOne({
                    where: {id: detail.kategori.lain_id}, include: [
                        {model: db.Jenis, as: 'jenis'},
                    ]
                });
                alatanObj['jenisAlat'] = lain.jenis.name;
                alatanObj['idAlat'] = lain.jenis_id;
                if (alatan.resit !== '') {
                    jumlahSudahDibayar += parseFloat(detail.caj)
                } else {
                    jumlahBelumDibayar += parseFloat(detail.caj)
                }
            } else {
                alatanObj['jenisAlat'] = '';
                alatanObj['idAlat'] = '';
            }

            if (detail.tentusan === 'Gagal') {
                alatanObj['gagal'] = true;
                alatanObj['cajGagal'] = parseFloat(detail.caj);
                alatanObj['cajBerjaya'] = 0;
            } else {
                alatanObj['gagal'] = false;
                alatanObj['cajGagal'] = 0;
                alatanObj['cajBerjaya'] = parseFloat(detail.caj);

            }

            alatanArr.push(alatanObj)
        }
    }

    return {
        'alatanArr': alatanArr,
        'paymentArr': paymentArr,
        'jumlahBelumDibayar': jumlahBelumDibayar,
        'jumlahSudahDibayar': jumlahSudahDibayar
    }
}
