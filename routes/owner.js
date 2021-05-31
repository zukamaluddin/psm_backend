var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');
const auditTrail = require('../middleware/auditTraill/index.js');
const {Op} = require("sequelize");
var authJWT = require("../middleware/auth/index.js")

router.use(authJWT.verifyToken);
router.post('/create/:userid', auditTrail.trace, function (request, response) {
    let token = request.query
    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        data = data['registerOwner'];
        // console.log(data['noRocRob'].length)
        if (data['noRocRob'].length == 0) {
            data['noRocRob'] = null
        } else {
            let check = await db.Owner.findOne({
                where: {id: data['noRocRob']},
            }).catch(e => {
                console.log(e)
            });
            if (check) {
                response.end(JSON.stringify({status: "ERROR"}));
            }


        }
        let pegawai = await db.User.findOne({
            where: {id: request.params.userid},
            include: [
                {model: db.Branch, as: 'branch'}
            ]
        });
        let check = await db.Owner.findOne({
            where: {
                code: {
                    [Op.like]: '%' + pegawai.branch.code + '%'
                }
            },
            order: [["code", 'DESC']]
        })
        let code
        console.log(pegawai.branch.code)
        if (check) {

            codeVir = check.code.split(pegawai.branch.code);
            branceCode = codeVir[0]
            running = parseInt(codeVir[1]) + 1
            code = pegawai.branch.code.toString() + running.toString().padStart(6, "0")
        } else {
            let index = 1
            code = pegawai.branch.code.toString() + index.toString().padStart(6, "0")
        }

        db.Owner.create({
            name: data['name'],
            noRocRob: data['noRocRob'],
            code: code,
            address: data['address'],
            agency: data['agency'],
            telNo: data['telNo'],
            statusBayaran: data['statusBayaran'],
            codeid: data['codeid'],

            created_by: request.params.userid,
        }).then(function (data) {
            response.end(JSON.stringify({status: "OK"}));
        }).catch(function (err) {
            console.log(err)
            response.end(JSON.stringify({status: "ERROR"}));
        });
    });
});

router.post('/list/:userid', auditTrail.trace, async function (request, response) {
    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {
        let token = request.query
        if (err) throw err
        let body = JSON.parse(fields.data);
        let whereS = {isDeleted: false};

        if (Object.entries(body.name).length > 0) {
            whereS.name = {
                [Op.like]: '%' + body.name + '%'
            }
        }

        if (Object.entries(body.noRocRob).length > 0) {
            whereS.noRocRob = {
                [Op.like]: '%' + body.noRocRob + '%'
            }
        }

        if (Object.entries(body.agency).length > 0) {
            if (body.agency !== 'All') {
                whereS.agency = body.agency
            }

        }
        if (Object.entries(body.address).length > 0) {
            if (body.address !== 'All') {
                whereS.address = {
                    // [Op.like]: '%Maintenance%'
                    [Op.like]: '%' + body.address + '%'
                }
            }
        }

        let sorted = [];
        if (body.sorted.length > 0) {
            if (body.sorted[0]['id'] === "name") {
                sorted.push(["name", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            }
            if (body.sorted[0]['id'] === "noRocRob") {
                sorted.push(["noRocRob", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            }
            if (body.sorted[0]['id'] === "agency") {
                sorted.push(["agency", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            }
            if (body.sorted[0]['id'] === "state") {
                sorted.push(["state", (body.sorted[0]['desc'] ? 'DESC' : 'ASC')])
            }

            if (body.sorted[0]['id'] === "date_created") {
                sorted.push(["date_created", (body.sorted[0]['date_created'] ? 'ASC' : 'DESC')])
            }

        } else {
            sorted.push(["date_created", 'DESC'])
        }

        db.Owner.findAndCountAll({
            where: whereS,
            order: sorted,
            limit: body.pageSize,
            offset: body.page * body.pageSize,
            raw: true
        }).then(results => {
            response.send({status: 'OK', data: results.rows, count: Math.ceil(results.count / body.pageSize)})
        }).catch(function (err) {
            console.log(err)
            response.end(JSON.stringify({status: "ERROR"}));
        });
    })
});

router.delete('/delete/:id/:userid', auditTrail.trace, function (request, response) {
    let token = request.query
    let data = request.body.data;
    if (data.length > 0) {
        let updateValues = {isDeleted: true};
        db.Owner.update(updateValues, {where: {id: data}}).then(function (data) {
            response.send({status: 'OK', msg: 'User deleted'})
        }).catch(function (err) {
            console.log(err)
            response.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        response.send({status: 'FAILED', msg: 'No data selected.'})
    }
});
router.get('/checkROC/:data/:userid', auditTrail.trace, function (request, response) {
    let token = request.query.token
    let id = request.query.id
    let data = request.params.data;
    db.Owner.findOne({

        where: {noRocRob: data, id: {[Op.ne]: id}},

    },).then(function (data) {
        if (data) {
            response.send({status: true, msg: 'exist'})
        } else {
            response.send({status: false, msg: 'success'})
        }
    }).catch(function (err) {
        console.log(err)
        response.send({status: false, msg: 'An error has occured!'})
    });
});
router.post('/update/:id/:userid', auditTrail.trace, function (request, response) {
    let token = request.query
    const form = new formidable.IncomingForm();

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);


        let check = await db.Owner.findOne({
            where: {id: {[Op.ne]: data.id}, noRocRob: data['noRocRob']},
        }).catch(e => {
            console.log(e)
        });
        if (check && data['noRocRob']) {
            response.end(JSON.stringify({status: "ERROR"}));
        }

        let user = await db.Owner.findOne({where: {id: data.id}});
        if ('name' in data) {
            user.name = data.name;
        }
        if ('noRocRob' in data) {
            if (data.noRocRob) {
                user.noRocRob = data.noRocRob;
            } else {
                user.noRocRob = null
            }
        }
        if ('address' in data) {
            user.address = data.address;
        }
        if ('agency' in data) {
            user.agency = data.agency;
        }
        if ('telNo' in data) {
            user.telNo = data.telNo;
        }
        if ('codeid' in data) {
            user.codeid = data.codeid;
        }
        if ('statusBayaran' in data) {
            user.statusBayaran = data.statusBayaran;
        }

        await user.save().then(function (data) {
            response.end(JSON.stringify({
                status: "OK",
            }));
        }).catch(function (err) {
            console.log(err)
            response.send({status: false, msg: 'An error has occured!'})
        });


    })
});

router.get('/code/:permission', async function (request, response) {
    let data = request.params.permission;
    if (data != '0177181315') {
        response.send({status: false, msg: 'please la'})

    }
    let getacd = await db.Owner.findAll({raw: true}).then(function (rac) {
        if (rac) {
            rac.map(async (x, index) => {
                if (x) {
                    db.Owner.update({
                        code: index.toString().padStart(6, "0"),
                    }, {
                        where: {id: x.id},
                        returning: true,
                        plain: true
                    })
                }

            })

        }
        response.send({status: true, msg: 'ok'})
    }).catch(function (err) {
        console.log(err)
        response.send({status: false, msg: 'An error has occured!'})
    });

    // await  getacd.save().then(function (data) {
    //     console.log(data)
    // }).catch(function (err) {
    //     console.log(err)
    // });
    // response.send({status: false, msg: '1111111111111'})

});


router.get('/fulladdress/:permission', async function (request, response) {
    let data = request.params.permission;
    if (data != '0177181315') {
        response.send({status: false, msg: 'please la'})

    }
    let getacd = await db.Owner.findAll({raw: true}).then(function (rac) {
        if (rac) {
            rac.map(async (x, index) => {
                if (x) {
                    if (x.district && x.state) {
                        db.Owner.update({
                            address: x.streetAddressNo + ' ' + x.placeArea + ' ' + x.district.replace('/', ' ') + ' ' + x.state,
                        }, {
                            where: {id: x.id},
                            returning: true,
                            plain: true
                        })
                    }
                    // console.log(x.streetAddressNo + ' ' +x.placeArea + ' ' + x.district.replace('/', ' ') + ' ' + x.state)

                }

            })

        }
        response.send({status: true, msg: 'ok'})
    }).catch(function (err) {
        console.log(err)
        response.send({status: false, msg: 'An error has occured!'})
    });

    // await  getacd.save().then(function (data) {
    //     console.log(data)
    // }).catch(function (err) {
    //     console.log(err)
    // });
    // response.send({status: false, msg: '1111111111111'})

});


module.exports = router;
