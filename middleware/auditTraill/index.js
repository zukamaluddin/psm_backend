var db = require('../../models');

exports.trace = (req, res, next) => {
        // db.AuditTrail.create({
        //     user_id: req.params.userid,
        //     path: req.originalUrl
        // }).then(el => next())
        // .catch(err => res.status(401).send('User Not Found'));
    try{
        db.AuditTrail.create({
            user_id: req.params.userid,
            path: req.originalUrl + 'kamaladli'
        })
        .catch(e => {
            res.status(401).send('User Not Found')
        })
    }catch(e){
        res.status(401).send('User Not Found')
    }finally{
        next()
    }
};


exports.add = (userid, url) => new Promise((resolve, reject) => {
    db.AuditTrail.create({
        user_id: userid,
        path: url
    }).then(el => resolve())
    .catch(err => {res.status(401).send('User Not Found');reject();});
});
