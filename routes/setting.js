var db = require('../models');
var express = require('express');
var router = express.Router();
let fs = require('fs');
var path = require('path');
let formidable = require('formidable');

router.post('/listJawatanPentadbiran',  async function (req, res) {
    db.JawatanPentadbiran.findAndCountAll({
        // where: wheres
        // ,
        // // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        // limit: req.body.pageSize,
        // offset: req.body.page * req.body.pageSize,
    }).then(function (result) {
        // let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: result.rows, count: '1'})
    });
});

router.post('/createJawatanPentadbiran', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        db.JawatanPentadbiran.create({
            name: data.name,
            elaun: data.elaun,
            sort: data.sort
        }).then(function (data) {
            res.write(JSON.stringify({status: "OK"}));
            res.end();
        });
    });
});

router.put('/updateJawatanPentadbiran', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let pentadbiran = await db.JawatanPentadbiran.findOne({where: {id: data.id}});
        if ('name' in data) {
            pentadbiran.name = data.name;
        }
        if ('elaun' in data) {
            pentadbiran.elaun = data.elaun;
        }
        await pentadbiran.save();
        res.write(JSON.stringify({status: "OK"}));
        res.end();
    });
});

router.delete('/deleteJawatanPentadbiran', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.JawatanPentadbiran.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Jawatan Pentadbiran deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }
});

router.get('/viewJawatanPentadbiran/:id', function (req, res) {
    db.JawatanPentadbiran.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            res.send({data: data})
        } else {
            res.send({status: 'FAILED', msg: 'Task not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

// ====================================================================================================================

router.post('/listJawatanGred',  async function (req, res) {
    db.JawatanGred.findAndCountAll({
        // where: wheres
        // ,
        // // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        // limit: req.body.pageSize,
        // offset: req.body.page * req.body.pageSize,
    }).then(function (result) {
        // let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: result.rows, count: '1'})
    });
});

                    router.post('/createJawatanGred', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        db.JawatanGred.create({
            name: data.name,
            gred: data.gred,
            sort: data.sort
        }).then(function (data) {
            res.write(JSON.stringify({status: "OK"}));
            res.end();
        });
    });
});

router.put('/updateJawatanGred', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let gred = await db.JawatanGred.findOne({where: {id: data.id}});
        if ('name' in data) {
            gred.name = data.name;
        }
        if ('gred' in data) {
            gred.gred = data.gred;
        }
        await gred.save();
        res.write(JSON.stringify({status: "OK"}));
        res.end();
    });
});

router.delete('/deleteJawatanGred', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.JawatanGred.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Jawatan Gred deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }
});

router.get('/viewJawatanGred/:id', function (req, res) {
    db.JawatanGred.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            res.send({data: data})
        } else {
            res.send({status: 'FAILED', msg: 'Task not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

// ====================================================================================================================

router.post('/listJawatanLantikan',  async function (req, res) {
    db.JawatanLantikan.findAndCountAll({
        // where: wheres
        // ,
        // // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        // limit: req.body.pageSize,
        // offset: req.body.page * req.body.pageSize,
    }).then(function (result) {
        // let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: result.rows, count: '1'})
    });
});

router.post('/createJawatanLantikan', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        db.JawatanLantikan.create({
            name: data.name,
            sort: data.sort
        }).then(function (data) {
            res.write(JSON.stringify({status: "OK"}));
            res.end();
        });
    });
});

router.put('/updateJawatanLantikan', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let lantikan = await db.JawatanLantikan.findOne({where: {id: data.id}});
        if ('name' in data) {
            lantikan.name = data.name;
        }
        await lantikan.save();
        res.write(JSON.stringify({status: "OK"}));
        res.end();
    });
});

router.delete('/deleteJawatanLantikan', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.JawatanLantikan.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Jawatan Lantikan deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }
});

router.get('/viewJawatanLantikan/:id', function (req, res) {
    db.JawatanLantikan.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            res.send({data: data})
        } else {
            res.send({status: 'FAILED', msg: 'Task not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

// ====================================================================================================================

router.post('/listJawatanGenerik',  async function (req, res) {
    db.JawatanGenerik.findAndCountAll({
        // where: wheres
        // ,
        // // order: [[req.body.sorted[0].id, req.body.sorted[0].desc ? 'ASC' : 'DESC']],
        // limit: req.body.pageSize,
        // offset: req.body.page * req.body.pageSize,
    }).then(function (result) {
        // let totalPageNum = Math.ceil(result.count / req.body.pageSize);
        res.send({data: result.rows, count: '1'})
    });
});

router.post('/createJawatanGenerik', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        db.JawatanGenerik.create({
            name: data.name,
            kod: data.kod,
            sort: data.sort
        }).then(function (data) {
            res.write(JSON.stringify({status: "OK"}));
            res.end();
        });
    });
});

router.put('/updateJawatanGenerik', function (req, res) {
    const form = new formidable({multiples: true});
    form.parse(req, async function (err, fields, files) {
        let data = JSON.parse(fields.data);
        let gred = await db.JawatanGenerik.findOne({where: {id: data.id}});
        if ('name' in data) {
            gred.name = data.name;
        }
        if ('gred' in data) {
            gred.gred = data.gred;
        }
        await gred.save();
        res.write(JSON.stringify({status: "OK"}));
        res.end();
    });
});

router.delete('/deleteJawatanGenerik', function (req, res) {
    let data = req.body.data;
    if (data.length > 0) {
        db.JawatanGenerik.destroy({where: {id: data}}).then(function (data) {
            res.send({status: 'OK', msg: 'Jawatan Generik deleted'})
        }).catch(function (err) {
            console.log(err)
            res.send({status: 'FAILED', msg: 'An error has occured!'})
        });
    } else {
        res.send({status: 'FAILED', msg: 'No data selected.'})
    }
});

router.get('/viewJawatanGenerik/:id', function (req, res) {
    db.JawatanGenerik.findOne({
        where: {id: req.params.id},
    },).then(async function (data) {
        if (data) {
            res.send({data: data})
        } else {
            res.send({status: 'FAILED', msg: 'Task not found'})
        }
    }).catch(function (err) {
        console.log(err)
        res.send({status: 'FAILED', msg: 'An error has occured!'})
    });
});

module.exports = router;