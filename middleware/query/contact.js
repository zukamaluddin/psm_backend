var db = require('../../models');
const chalk = require('chalk');
const log = console.log;

exports.find_contact_by_status = async (request, response, next) => {
    let s1 = await db.Repairer.findAll({
        attributes: ['id','name','address','telNo','lesenNo','noRocRob'],
        where: {is_bukku: false },             //TODO 
        limit: 5,
        raw: true
    }).catch( _ => response.end(JSON.stringify({'status': 'Failed find_contact_by_status Repairer'})))
 
    let s2 = await db.Owner.findAll({
        attributes: ['id','name','address','telNo','noRocRob'],
        where: {is_bukku: false },             //TODO 
        limit: 40,
        raw: true
    }).catch( _ => response.end(JSON.stringify({'status': 'Failed find_contact_by_status Owner'})))

    Promise.all([s1, s2]).then(_=> {
        response.locals.data = JSON.stringify(_)
        next()
    }).catch( _ => response.end(JSON.stringify({'status': 'Failed find_contact_by_status'})))

}

exports.update_contact_by_status = async (request, response, next) => {

    let reqStatus = response.locals.data

    Promise.allSettled(reqStatus.map((data , index) => {
            return new Promise(function(resolve, reject){
                let value = JSON.parse(data['value'])
                if(data['status'] === 'fulfilled'){
                    if ("contact_id" in value){
                        db.Owner.update({is_bukku: true, bukku_id: value['contact_id']},{where: {id: value['id']}})
                        .then(function (__) {
                            if(__[0] === 0){
                                db.Repairer.update({is_bukku: true, bukku_id: value['contact_id']},{where: {id: value['id']}})
                                .then(function (___) {
                                    resolve()
                                })
                            }else{
                                resolve()
                            }
                        }).catch(function (err) {
                            reject()
                        });
                    }else{
                        db.Owner.update({is_bukku: true},{where: {id: value['id']}})
                    .then(function (__) {
                        if(__[0] === 0){
                            db.Repairer.update({is_bukku: true},{where: {id: value['id']}})
                            .then(function (___) {
                                resolve()
                            })
                        }else{
                            resolve()
                        }
                    }).catch(function (err) {
                        reject()
                    });
                    }
                    
                }else{
                    reject()
                }
            })
        })
    ).then(_ => {
        next()
    })

}

exports.find_contact_by_id = async (request, response, next) => {
    
    if (request.params['type'].toLocaleUpperCase() === 'REPAIRER'){
        await db.Repairer.findOne({
            attributes: ['bukku_id', 'id','name','address','telNo','lesenNo','noRocRob'],
            where: {id: request.params['repair_id']},
            raw: true
        })
        .then(function (result) {
            response.locals.data = JSON.stringify(result)
            next()
        })
    }
    else{
        await db.Owner.findOne({
            attributes: ['id', 'bukku_id','name','address','telNo','noRocRob'],
            where: {id: request.params['repair_id']},
            raw: true
        })
        .then(function (result) {
            response.locals.data = JSON.stringify(result)
            next()
        })
    }
}


exports.find_payment_by_id = async (request, response, next) => {
    db.Payment.findAll({
        where: {is_bukku: false },             //TODO 
        raw: true,
        limit: 50,
        include: [
                {
                    model: db.Alatan, as: 'alatan', attributes: ['resit', 'jenisresit','tarikh','tahun'], where : {tahun: '2021'},
                    include: [{model: db.User, as: 'user',attributes: [], include: [{model: db.Branch, as : 'branch', attributes: ["code","regional"]}]}]
                }
        ]
    }).then(_ => {
       Promise.all(_.map(async (data, index) => {
           let param = {}
           try {
               if(JSON.parse(data['invoiceTo'])['id'] === undefined || JSON.parse(data['invoiceTo'])['id'] === null ){
                return {address: {"address" : "" , "name" : "Cash Sales"}}
               }
                param['id'] = JSON.parse(data['invoiceTo'])['id']
           }catch(e) {
              
               param['name'] = data['invoiceTo']
           }

            let owner = await db.Owner.findOne({
                attributes: ['address', 'name'],
                raw: true,
                where : param
            })

            let repairer = await db.Repairer.findOne({
                attributes: ['address', 'name'],
                raw: true,
                where : param
            })
            if(owner  === null){
                return {address: repairer}
            }else{
                return {address: owner}
            }
            
        })
       ).then(__ => {
           response.locals.data = JSON.stringify({ data:_ , address : __})
           next()
       })
    }).catch( _ => {
        response.end(JSON.stringify({'status': 'Failed'}))
        
    })
}


exports.update_payment_by_status  = async (request, response, next) => {

    let reqStatus = response.locals.data
    // console.log(reqStatus)
    Promise.allSettled(reqStatus.map((data , index) => {
            return new Promise(function(resolve, reject){
                let value = JSON.parse(data['value'])

                if(data['status'] === 'fulfilled'){
            
                    if ("transactions_id" in value){
                        db.Payment.update({is_bukku: true, bukku_id: value['transactions_id']},{where: {id: value['id']}})
                        .then(function (data) {
                            resolve()
                        }).catch(function (err) {
                            reject()
                        });
                    }else{

                        db.Payment.update({is_bukku: true},{where: {id: value['id']}})
                        .then(function (__) {
                            resolve()
                        })
                    }
                }else{
                    reject()
                }
            })
        })
    ).then(_ => {
        // console.log(_ )
        next()
    })

    
}

exports.count_contact = async (request, response, next) => {
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
        log(chalk.white.bgGreen.bold('Total remain repairer : '+ _[0]));
        log(chalk.white.bgGreen.bold('Total remain owner : '+ _[1]));

        let total =  parseInt(_[0]) +  parseInt(_[1])
        if(parseInt(total) === 0) {
            response.end(JSON.stringify({'status': 'Success amount 0'}))
        }else{
            next()
        }


    }).catch( _ => {
        log(chalk.white.bgRed.bold('ERROR : '+ _));
        response.end(JSON.stringify({'status': 'Failed count_contact'}))
    })
}

exports.count_contact_func = async () => {
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
        let total =  parseInt(_[0]) +  parseInt(_[1])
        return total
    }).catch( _ => {
        return 0
    })
}

exports.count_payment_func = async () => {
    db.Payment.count({
        where: {is_bukku: false },             //TODO 
        raw: true
    })
    .then(_ => {
        return parseInt(_)
    }).catch( _ => {
        return 0
    })
}

exports.count_payment = async (request, response, next) => {
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
        log(chalk.white.bgGreen.bold('Total remain : '+ _));

        if (parseInt(_) === 0) {
            response.end(JSON.stringify({'status': 'Success amount 0'}))
        }else{
            next()
        }
        
    }).catch( _ => response.end(JSON.stringify({'status': 'Failed'})))
}