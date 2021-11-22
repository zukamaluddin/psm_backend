const db = require('../models');
const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const {Op} = require("sequelize");

const env = require('../config/config')['environment'];
const config = require('../config/config')[env];
const mv = require('mv');

router.post('/list/:userid', async function (req, res) {

    let role_id = '';
    let pos_id = '';
    let branch_id = '';

    let roleCondition = {
        [Op.or]: {
            [Op.like]: '%' + role_id + '%',
            [Op.is]: null
        }
    };
    let posCondition = {
        [Op.or]: {
            [Op.like]: '%' + pos_id + '%',
            [Op.is]: null
        }
    };
    let branchCondition = {
        [Op.or]: {
            [Op.like]: '%' + branch_id + '%',
            [Op.is]: null
        }
    };

    db.User.findAndCountAll({
        where: {
            name: {
                [Op.like]: '%' + req.body.name + '%'
            },
            email: {
                [Op.like]: '%' + req.body.email + '%'
            },
            status: {
                [Op.like]: '%' + req.body.status + '%'
            },
        },
        order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'DESC' : 'ASC']],
        limit: req.body.pageSize,
        offset: req.body.page * req.body.pageSize,

    }).then(function (result) {
        let userArr = [];
        result.rows.forEach(function (user, index, arr) {
            let userObj = {};
            userObj['id'] = user.id;
            userObj['staffId'] = user.staffId;
            userObj['email'] = user.email;
            userObj['name'] = user.name;
            userObj['position'] = user.jawatan;
            userObj['phone'] = user.phone;
            userObj['branch'] = user.cawangan;
            userObj['status'] = user.status;
            userArr.push(userObj);
        });
        let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: userArr, count: totalPageNum})

    });


});

router.delete('/delete/:userid', async function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        let user = await db.User.findAll({
            where: {
                id: {
                    [Op.in]: data
                },
            }
        });

        user.forEach(function (user, index, arr) {
            user.status = 0;
            user.save();
        });

        res.send({status: 'OK', msg: 'User deleted'})
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }

});

router.post('/create/:userid', function (request, response) {
    const form = new formidable.IncomingForm();

    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);


        db.User.create({
            name: data['name'],
            staffId: data['staffId'],
            email: data['email'],
            phone: data['phone'],
            jawatan: data['position'],
            cawangan: data['branch'],
            status: data['status'] === "Active" ? 1 : 0,
            password: "111111"
        }).then(function (data) { 
            response.write(JSON.stringify({status: "OK"}));
            response.end();
        });
    });
});

router.get('/view/:id', function (req, res) {
    db.User.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            console.log(data, "@@@@");
            res.send({
                // picture: data.picture,
                id: data.id,
                email: data.email,
                role: data.jawatan,
                status: data.status,

                staffId: data.staffId,
                name: data.name,
                // position: data.position ? data.position.name : null,
                phone: data.phone,
                branch: data.cawangan,
            })
        } else {
            res.send({status: 'FAILED', msg: 'User not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

router.post('/update/:userid', function (request, response) {
    const form = new formidable.IncomingForm();
    form.parse(request, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let user = await db.User.findOne({where: {id: request.params.userid}});

        if ('staffId' in data) {
            user.staffId = data.staffId;
        }
        if ('name' in data) {
            user.name = data.name;
        }
        if ('phone' in data) {
            user.phone = data.phone;
        }
        if ('email' in data) {
            user.email = data.email;
        }

        if ('role' in data) {
            user.jawatan =  data.role;
        }

        if ('branch' in data) {
                user.cawangan = data.branch;
        }
        if ('status' in data) {
            console.log(data['status'])
            user.status = data['status']
        }

        await user.save();
       
        response.write(JSON.stringify({
            status: "OK"
        }));
        response.end();

    });
});

router.post('/change_password/:userid', async function (request, response) {
    let user = await db.User.findOne({where: {id: request.params.userid}});
    user.password = request.body.password;
    await user.save();
    response.send({status: 'OK', msg: 'Password updated'})
});

router.post('/login', async function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    var user = await db.User.findOne({
        where: {email: email, password: password
        }
    });

    if (user) {
        if(["HQ","Manager Cawangan"].includes(user.jawatan) ){
            user.token = uuidv4();
            await user.save();
            res.send({
                status: 'OK',
                token: "",
                userid: user.id,
                branch_id: "01b3ce72-7206-405b-80e1-32668123e46e",
                name: user.name,
                role: "Administrator",
                position: user.jawatan,
                jawatan: user.jawatan,
                cawangan: user.cawangan,
                picture: "",
            })
        }else{
            res.send({status: 'FAILED', msg: 'Pengguna tidak berdaftar!'})
        }
        


    } else {
        res.send({status: 'FAILED', msg: 'Emel atau kata laluan salah!'})
    }


});

router.post('/login_mobile', async function (req, res) {
    const form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {

        var email = fields.email;
        var password = fields.password;

        var user = await db.User.findOne({
            where: {email: email, password: password, jawatan: 'Staf'}
        });

        if (user) {
            res.send({
                status: 'OK',
                staffId: user.staffId,
                name: user.name,
                phone: user.phone,
                jawatan: user.jawatan,
                cawangan: user.cawangan,
            })
        } else {
            res.send({status: 'FAILED', msg: 'Emel atau kata laluan salah!'})
        }
    })
    
});


module.exports = router;
