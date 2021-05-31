var db = require('../../models');
const chalk = require('chalk');
const log = console.log;

exports.find_branch_by_status = async (request, response, next) => {
    db.Branch.findAll({
        attributes: ['id','code','regional','state','bukku_grp_id'],
        where: {is_bukku: false },             //TODO 
        raw: true
    })
    .then(_ => {
        response.locals.data = _
        next()
    }).catch( _ => response.end(JSON.stringify({'status': 'Failed'})))
}

exports.count_branch = async (request, response, next) => {
    db.Branch.count({
        where: {is_bukku: false },             //TODO 
        raw: true
    })
    .then(_ => {
        response.locals.data = _

        log(chalk.white.bgGreen.bold('Total remain : '+ _));

        (parseInt(_) === 0) && response.end(JSON.stringify({'status': 'Success'}))

        next()
    }).catch( _ => response.end(JSON.stringify({'status': 'Failed Count_branch' + _})))
}

exports.update_branch_status = async (request, response, next) => {
    let reqStatus = response.locals.data

    Promise.allSettled(reqStatus.map((data , index) => {
            return new Promise(function(resolve, reject){
                let value = JSON.parse(data['value'])
                if(data['status'] === 'fulfilled'){
                    db.Branch.update({is_bukku: true, bukku_id: value['tag_id']},{where: {id: value['id']}})
                    .then(function (data) {
                        resolve()
                    }).catch(function (err) {
                        reject()
                    });
                }else{
                    reject()
                }
            })
        })
    ).then(_ => {
        next()
    })
    
}

exports.update_branch_by_group_id  = async (request, response, next) => {
    let grp_id = response.locals.data['tag_group']['id']

    db.Branch.update({bukku_grp_id: grp_id},{where: {is_bukku : false}})
    .then(function (data) {
        next()
    }).catch(function (err) {
        response.send({status: 'FAILED', msg: 'An error has occured!'})
    });
}

exports.find_branch_id = async (request, response, next) => {
    await db.Branch.findOne({
        attributes: ['bukku_id', 'bukku_grp_id', 'code', 'regional', 'state'],
        where: {id: request.params['brach_id']},
        raw: true
    })
    .then(function (result) {
        response.locals.data = JSON.stringify(result)
        next()
    })
}