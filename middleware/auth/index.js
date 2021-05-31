const jwt = require("jsonwebtoken");
const config = require("../../config/auth.config.js")
const auditTrail = require("../auditTraill/index.js")

exports.verifyToken = (req, res, next) => {
    // let token = req.headers["x-access-token"];
    // if (!token) {
    //   return res.status(401).send({
    //     status: 'Failed',
    //     message: "No token provided!"
    //   });
    // }
    //
    // jwt.verify(token, config.secret, (err, decoded) => {
    //   if (err) {
    //     return res.status(401).send({
    //       status: 'Failed',
    //       message: "Unauthorized!"
    //     });
    //   }
    //   // auditTrail.add(decoded.userid, req.originalUrl);
    //   next();
    // });
    next()
};

exports.generateToken = (userid) => new Promise((resolve, reject) => {
        let v = jwt.sign({ userid: userid }, config.secret, {
            expiresIn: "10h" // 10h
          });
          resolve(v);
    // })
});