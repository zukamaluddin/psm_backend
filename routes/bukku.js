var express = require('express');
var http = require("request");
var bukku = require("../middleware/bukku")
var queryB = require("../middleware/query/branch")
var queryC = require("../middleware/query/contact")
const router = express.Router();
var db = require('../models');



router.use(function(req, res, next){
    res.locals.status = false           //middle ware status checking
    next();
})

router.get('/test', queryC.count_contact_func , function (request, response) {
    response.end('OK')
});

router.get('/add_group_tags', bukku.add_grp_tags, queryB.update_branch_by_group_id, function (request, response) {
    response.end(JSON.stringify({status: "Success"}))
});

router.get('/add_tags', queryB.count_branch, queryB.find_branch_by_status , bukku.add_tags, queryB.update_branch_status, function (request, response , next) {
    response.end(JSON.stringify({status: 'Success'}))    
});

router.get('/update_tags/:brach_id', queryB.find_branch_id, bukku.update_tags, function (request, response) {
    response.end(JSON.stringify({status: 'Success'}))
});

router.get('/delete_tags/:brach_id', queryB.find_branch_id, bukku.delete_tags, function (request, response) {
    response.end(JSON.stringify({status: 'Success'}))
});

router.get('/add_contact', queryC.count_contact ,queryC.find_contact_by_status, bukku.add_contact, queryC.update_contact_by_status, function (request, response) {
    response.end(JSON.stringify({status: 'Success'}))
});

router.get('/update_contact/:repair_id/:type', queryC.find_contact_by_id, bukku.update_contact, function (request, response) {
    response.end(JSON.stringify({status: 'Success'}))
});

router.get('/delete_contact/:repair_id/:type', queryC.find_contact_by_id, bukku.delete_contact, function (request, response) {
    response.end(JSON.stringify({status: 'Success'}))
});

router.get('/add_invoice', queryC.count_payment, queryC.find_payment_by_id, bukku.add_invoice, queryC.update_payment_by_status, function (request, response) {

    response.end(JSON.stringify({status: 'Success'}))
});


 

module.exports = router; 