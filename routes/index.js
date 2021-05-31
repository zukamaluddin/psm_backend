var db = require('../models');
var express = require('express');
var router = express.Router();
const {v4: uuidv4} = require('uuid');
var path = require('path');
const auth = require("../middleware/auth/index.js");
const nodemailer = require('nodemailer');

const env = require(__dirname + '/../config/config.js')['environment'];
const config = require(__dirname + '/../config/config.js')[env];

// const transporter = nodemailer.createTransport({
//     host: config.mailHost,
//     port: config.mailPort,
//     secure: true,
//     auth: {
//         user: config.mailUsername,
//         pass: config.mailPassword
//     }
// });

router.post('/login', async function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    var user = await db.User.findOne({
        where: {email: email, password: password}
    });

    if (user) {

        user.token = uuidv4();
        await user.save();
        res.send({
            status: 'OK',
            token: await auth.generateToken(user.id),
            userid: user.id,
            branch_id: "01b3ce72-7206-405b-80e1-32668123e46e",
            name: user.name,
            role: "Administrator",
            position: "HQ",
            picture: "",
        })


    } else {
        res.send({status: 'FAILED', msg: 'Emel atau kata laluan salah!'})
    }


});


router.post('/forgot_password', async function (req, res) {

    let token = uuidv4();
    let frontendUrl = req.body.frontendUrl + '/#/reset-password/' + token;
    let user = await db.User.findOne({where: {email: req.body.email}});
    if (user) {

        await db.User.update({token: token}, {where: {email: req.body.email}});

        let mailOptions = {
            from: config.mailUsername,
            to: req.body.email,
            subject: 'e-Data - Set Semula Kata Laluan',
            html: '<h1 style="border-bottom: 1px dashed black;font-size: 25px;">Set Semula Kata Laluan</h1>' +
                '<p>Hi </p>' +user.name+
                '<p>Anda telah menghantar permintaan untuk set semula kata laluan.</p>'+
                '<p>Sila klik link di bawah untuk set semula kata laluan:</p>'+
                '<a href= ' + frontendUrl + '><b>Set Semula Kata Laluan</b></a>' +
                '<p>Sila abaikan emel ini jika anda tidak mahu menukar kata laluan.</p>'+
                '<p  style="border-bottom: 1px dashed black;padding-bottom: 15px;">Terima Kasih.</p>'
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.send({status: 'FAILED', msg: 'An error has occured!'})
            } else {
                console.log('Email sent: ' + info.response);
                res.send({
                    status: 'OK',
                    msg: 'Mesej dihantar ke emel anda. Sila semak emel untuk set semula kata laluan.'
                });
            }
        });

    } else {
        res.send({status: 'FAILED', msg: 'Emel tidak dijumpai!'})
    }

});

router.post('/reset_password/:token', async function (request, response) {

    try {
        let user = await db.User.findOne({where: {token: request.params.token}});
        if (user) {
            user.password = request.body.newPassword;
            user.token = null;
            await user.save();
            response.send({status: 'OK', msg: 'Kata laluan berjaya diubah'})
        } else {
            response.send({status: 'FAILED', msg: 'Token tidak sah!'})
        }

    } catch (e) {
        response.send({status: 'FAILED', msg: 'An error has occured!'})
    }

});

router.get('/file/:userid/:filename', async function (req, res) {

    let userid = req.params.userid
    let filename = req.params.filename

    var picPath = path.join(__dirname, '../public/picture') + '/' + userid + '/' + filename;
    res.sendFile(picPath)

});

module.exports = router;
