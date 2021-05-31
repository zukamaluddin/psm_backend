var http = require("request");
const chalk = require('chalk');
const log = console.log;
var schedule = require('node-schedule');
var query = require("../middleware/query/contact")
var db = require('../models');

var url = require("../config/config")['urlEdata']

exports.JobsInvoice = () => {
    
    var j = schedule.scheduleJob('04 0 * * *', async function(){
        let total;
        let count;
        // let total = await query.count_payment_func();
        db.Payment.count({
            where: {is_bukku: false },             //TODO 
            raw: true,
            include: [
                {
                    model: db.Alatan, as: 'alatan', where : {tahun: '2021'},
                }
            ]
        })
        .then(_ => {
            total = parseInt(_)

            log(chalk.black.bgWhiteBright.bold('Running Jobs Invoice'));

            if (total >= 50){
                count = Math.round((total / 50)) + 3
            }else{
                count = 3;
            }

            var innetSS = schedule.scheduleJob('*/1 * * * *', function(){

                const options = {
                    // uri: "http://localhost:8080/edata-be/bukku/add_invoice",
                    uri: url + "/bukku/add_invoice",
                    method: 'GET',
                }
                http(options , function(err, resBukku, bodyBuku){
                    if (!err && resBukku.statusCode == 200) {
                        log(chalk.white.bgGreen.bold('Success : call api invoice'));
                    }else{
                        log(chalk.white.bgRed.bold('Failed : call api invoice'));
                    }
                })

                if(count == 0){
                    log(chalk.black.blueBright.bold('Finish : Running Jobs Contact'));
                    innetSS.cancel()
                }
                log(chalk.black.blueBright.bold('Balance : ' + count));
                count--;

            });

        }).catch( _ => {
            console.log("FAILED JOBS")
        })
    });
    
    
}

exports.JobsContact = () => {
    
    
    var jj = schedule.scheduleJob('30 2 * * *', async function(){
        // let total = await query.count_contact_func();
        let count;
        let total
        let repairer = await db.Repairer.count({
            where: {is_bukku: false },             //TODO 
            raw: true
        })
    
        let owner = await db.Owner.count({
            where: {is_bukku: false },             //TODO 
            raw: true
        })
        Promise.all([repairer, owner])
        .then(_ => {
            total  =  parseInt(_[0]) +  parseInt(_[1])

            log(chalk.black.bgWhiteBright.bold('Running Jobs Contact'));
            
            if (total >= 50){
                count = Math.round((total / 50)) + 3
            }else{
                count = 3;
            }
           
        }).catch( _ => {
            return 0
        })
        
        var innetSc = schedule.scheduleJob('*/1 * * * *', function(){
           
            const options = {
                // uri: "http://localhost:8080/edata-be/bukku/add_contact",
                uri: url  + "/bukku/add_contact",
                method: 'GET',
            }
            http(options , function(err, resBukku, bodyBuku){
                if (!err && resBukku.statusCode == 200) {
                    log(chalk.white.bgGreen.bold('Success : call api contact'));
                }else{
                    log(chalk.white.bgRed.bold('Failed : call api contact'));
                }
            })
            if(count == 0){
                log(chalk.black.blueBright.bold('Finish : Running Jobs Contact'));
                innetSc.cancel()
            }
            log(chalk.black.blueBright.bold('Balance : ' + count));
            count--;
        });
        
    });
    
    
}