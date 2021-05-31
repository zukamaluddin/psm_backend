var http = require("request");
var url = require("../../config/config")['urlBukku']
var token = require("../../config/config")['token']
var moment = require("moment");
const chalk = require('chalk');
const log = console.log;

let configHeader = {
    "Content-Type" : "application/json",
    "Authorization" : "Bearer " + token,
    "Company-Subdomain" : "dmsb",       //edata
    "Accept" : "application/json"
}

exports.add_grp_tags = async (request, response, next) => {
    const dataTemp = {
        "name": "e-data"
      }
    const options = {
        uri: url + "/tags/groups",
        method: 'POST',
        headers: configHeader,
        body: JSON.stringify(dataTemp),
    }
    http(options , function(err, resBukku, bodyBuku){
        if (!err && resBukku.statusCode == 200) {
            let info = JSON.parse(bodyBuku);
            if ("message" in info){                                                     //return 200 tapi ada key message - maksudnya error
                response.end(JSON.stringify({status: "Failed", msg: info['message']}))
            }else{
                response.locals.data = info
                next()
            }
        }else{
            response.end(JSON.stringify({status: "Failed", msg: "Error 500"}))
        }
        
        // console.error('error:', err); // Print the error if one occurred
        // console.log('statusCode:', resBukku && resBukku.statusCode); // Print the response status code if a response was received
        // console.log('body:', bodyBuku); // Print the HTML for the Google homepage.
       
    }).catch(__ => {
        console.log(__)
    })
    
} 

exports.add_tags = async (request, response, next) => {

    let allStatus = response.locals.data;
    
    Promise.allSettled(allStatus.map((data , index) => {
        
        const dataTemp = {
            "tag_group_id": data['bukku_grp_id'],
            "name": `${data['code']}-${data['regional']}`
        }
        const options = {
            uri: url + "/tags",
            method: 'POST',
            headers: configHeader,
            body: JSON.stringify(dataTemp),
        }
        return new Promise(function(resolve, reject){
            http(options , function(err, resBukku, bodyBuku){
                // console.log(resBukku.statusCode, "#######")
                // console.log(JSON.parse(bodyBuku), "#######")
                
                if (!err && resBukku.statusCode == 200) {
                    let info = JSON.parse(bodyBuku);
                    
                    "tag" in info ? resolve(JSON.stringify({id: data['id'], tag_id: info['tag']['id']})) : reject()
                }else{
                    log(chalk.white.bgRed.bold("API BUKKU : " + resBukku.statusCode + ' is ' + bodyBuku));
                    reject()
                }
            })
        });
    })).then(_ => {
        response.locals.data = _    // rejected and fulfilled
        next()
    })
} 

exports.delete_tags = async (request, response, next) => {
    const options = {
        uri: url + "/tags/" + JSON.parse(response.locals.data)['bukku_id'],
        method: 'DELETE',
        headers: configHeader,
    }

    http(options , function(err, resBukku, bodyBuku){
        if (!err && resBukku.statusCode == 200) {
            let info = JSON.parse(bodyBuku);
            next()
        }else{
            response.end(JSON.stringify({status: "Failed", msg: "Bukku Error"}))
        }
    })
}

exports.update_tags = async (request, response, next) => {
    let data = JSON.parse(response.locals.data);
    const dataTemp = {
        "tag_group_id": data['bukku_grp_id'],
        "name": `${data['code']}-${data['regional']}`
    }
    const options = {
        uri: url + "/tags/" + JSON.parse(response.locals.data)['bukku_id'],
        method: 'PUT',
        headers: configHeader,
        body: JSON.stringify(dataTemp),
    }

    http(options , function(err, resBukku, bodyBuku){
        if (!err && resBukku.statusCode == 200) {
            let info = JSON.parse(bodyBuku);
            next()
        }else{
            response.end(JSON.stringify({status: "Failed", msg: "Bukku Error"}))
        }
    })
}

exports.add_contact = async (request, response, next) => {
    let allData = JSON.parse(response.locals.data);
    let combineData = []
    
    allData.map((_, index) => {
        combineData.push(..._);
    })

    Promise.allSettled(combineData.map((data , index) => {
        const dataTemp = {
            "display_name": data['name'],
            "company_name":  data['name'],
            "reg_no": ('lesenNo' in data) ? (data['lesenNo']) ? data['lesenNo'] : data['noRocRob'] : data['noRocRob'],
            "phone_no": data['telNo'],
            "types": ["customer"],
            "default_currency_code": "MYR",
            "copy_billing_address": true,
            "default_term_id": 1,
            "copy_billing_address": true,
            "billing_address": {
                "street": data['address'],
                "city": "",
                "state": "",
                "postcode": "",
                "country_code": "MY"
                },
        }
        // console.log(dataTemp , "&&&&")
        const options = {
            uri: url + "/contacts",
            method: 'POST',
            headers: configHeader,
            body: JSON.stringify(dataTemp),
        }
        return new Promise(function(resolve, reject){
            http(options , function(err, resBukku, bodyBuku){
                if (!err && resBukku.statusCode == 200) {
                    let info = JSON.parse(bodyBuku);
                    "contact" in info ? resolve(JSON.stringify({id: data['id'], contact_id: info['contact']['id']})) : reject()
                }else{
                    if (!err && resBukku.statusCode == 422) {
                        resolve(JSON.stringify({id: data['id']}))
                    }else{
                        log(chalk.white.bgRed.bold("API BUKKU : " + resBukku.statusCode + ' is ' + bodyBuku));
                        reject()
                    }
                    
                }
            })
        });
    })).then(_ => {
        response.locals.data = _
        next()
    })
}

exports.update_contact = async (request, response, next) => {
    let data = JSON.parse(response.locals.data);
    const dataTemp = {
        "display_name": data['name'],
        "company_name":  data['name'],
        "reg_no": ('lesenNo' in data) ? (data['lesenNo']) ? data['lesenNo'] : data['noRocRob'] : data['noRocRob'],
        "phone_no": data['telNo'],
        "types": ["customer"],
        "default_currency_code": "MYR",
        "copy_billing_address": true,
        "default_term_id": 1,
        "copy_billing_address": true,
        "receivable_account_id": 4,
        "billing_address": {
            "street": data['address'],
            "city": "",
            "state": "",
            "postcode": "",
            "country_code": "MY"
            },
    }
    const options = {
        uri: url + "/contacts/" + JSON.parse(response.locals.data)['bukku_id'],
        method: 'PUT',
        headers: configHeader,
        body: JSON.stringify(dataTemp),
    }

    http(options , function(err, resBukku, bodyBuku){
        if (!err && resBukku.statusCode == 200) {
            let info = JSON.parse(bodyBuku);
            next()
        }else{
            response.end(JSON.stringify({status: "Failed", msg: "Bukku Error"}))
        }
    })
}


exports.delete_contact = async (request, response, next) => {
    const options = {
        uri: url + "/contacts/" + JSON.parse(response.locals.data)['bukku_id'],
        method: 'DELETE',
        headers: configHeader,
    }
    
    http(options , function(err, resBukku, bodyBuku){
        if (!err && resBukku.statusCode == 200) {
            let info = JSON.parse(bodyBuku);
            next()
        }else{
            response.end(JSON.stringify({status: "Failed", msg: "Bukku Error"}))
        }
    })
}

exports.add_invoice = async (request, response, next) => {
    let allStatus = JSON.parse(response.locals.data);
    contact_add = ""
    Promise.allSettled(allStatus['data'].map((data , index) => { 

        let payInfo = JSON.parse(payable(JSON.parse(data['data']), data['jenisBayaran']));
        let contactName = ''
        try{
            contactName = allStatus['address'][index]['address']['name']
            contact_add = allStatus['address'][index]['address']['address']
        }catch(e){
            contactName = data['invoiceTo']
            if( allStatus['address'][index]['address'] === undefined || allStatus['address'][index]['address'] === null){
                contact_add = ""
                console.log(contactName)
            }else{
                contact_add = allStatus['address'][index]['address']['address']
            }
            
        }

        let payload = {
           "contact_name" : contactName,
            "date" : moment(data['alatan.tarikh']).format("YYYY-MM-DD"),
            "currency_code" : "MYR",
            "billing_party": contact_add,
            "exchange_rate": 1,
            "tax_mode" : "exclusive",
            "payment_account_code": "3300-102",
            "number": (data["alatan.jenisresit"] === 'Manual') ? data["alatan.resit"] : `DMSB/${data["alatan.user.branch.code"]}/${data["alatan.tahun"]}/${data["alatan.resit"]}`,
            "tags": [`${data["alatan.user.branch.code"]}-${data["alatan.user.branch.regional"]}`],
            "items": payInfo['item'],
            "status": "ready",
            "remarks" : '1. Payment : CASH/CHEQUE/ ONLINE TRANSFER \n 2. All cheque / transfer should be made payable to: \n "DE METROLOGY SDN. BHD." \n MAYBANK : 5622-6355-4720'
        }

       
 
        const options = {
            uri: url + "/dmsb/batch_cash_invoices",
            method: 'POST',
            headers: configHeader,
            body: JSON.stringify({ "invoices" : [payload]}),
        }
        return new Promise(function(resolve, reject){
            http(options , function(err, resBukku, bodyBuku){
                
                if (!err && resBukku.statusCode == 200) {
                    let info = JSON.parse(bodyBuku);
                    "transactions" in info ? resolve(JSON.stringify({id: data['id'], transactions_id: info['transactions'][0]['id']})) : reject()
                }else{
                    if (!err && resBukku.statusCode == 400) {
                        log(chalk.black.bgYellow.bold("Warning: " + resBukku.statusCode + ' is ' + bodyBuku));
                        // console.log("MASUK")
                        resolve(JSON.stringify({id: data['id']}))
                    }else{
                        // console.log(payload)
                        log(chalk.white.bgRed.bold("API BUKKU : " + resBukku.statusCode + ' is ' + bodyBuku));
                        reject()
                    }
                }
            })
        });
    })).then(_ => {
        response.locals.data = _    // rejected and fulfilled
        next()
    })
}

payable = (listAmount, tax) => {
    let amount = 0.00;
    let items = []
    listAmount.map(_ => {
        amount = amount + parseFloat(_['jumlah'])
        if (_["jumlah"] != "0.00"){
            items.push({
                "account_code" : "5100-200",
                "description" : _["jenisPembayaran"],
                "quantity": 1,
                "unit_price": _["jumlah"],
                "tax_code": "SV6"
            })
        }
    })

    amount = parseFloat(amount).toFixed(2);

    let sst = (tax) == '6 %' ? amount * 0.06  : 0.00;
    sst = parseFloat(sst).toFixed(2)

    let adjt = adjustment(sst)
    adjt = parseFloat(adjt).toFixed(2)

    items.push({
        "account_code": "8053-100",
        "description": "Rounding Adjustment",
        "quantity": 1,
        "unit_price": adjt,
        "tax_code": ""
    })
    
    // Payable = (parseFloat(amount) + parseFloat(sst)) + parseFloat(adjt)
    return JSON.stringify({ item: items})
}

adjustment = (number) => {
    if (number.toString().endsWith('1')) {
        return -0.01
    } else if (number.toString().endsWith('2')) {
        return -0.02
    } else if (number.toString().endsWith('3')) {
        return +0.02
    } else if (number.toString().endsWith('4')) {
        return +0.01
    } else if (number.toString().endsWith('6')) {
        return -0.01
    } else if (number.toString().endsWith('7')) {
        return -0.02
    } else if (number.toString().endsWith('8')) {
        return +0.02
    } else if (number.toString().endsWith('9')) {
        return +0.01
    } else {
        return 0
    }
}
