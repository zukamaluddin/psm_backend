'use strict';
var {Sequelize, DataTypes} = require('sequelize');
// var role = require('./role');
// var position = require('./position');
var user = require('./user');
// var owner = require('./owner');
var mesin = require('./mesin');
// var repairer = require('./repairer');
// var alatan = require('./alatan');
// var detailalatan = require('./detailalatan');

// var jenis = require('./Jenis');
// var lain = require('./Lain');
// var kategori = require('./Kategori');
// var jenama = require('./Jenama');
// var payments = require('./payment');
// var auditTrails = require('./auditTrail.models.js')

const env = require(__dirname + '/../config/config.js')['environment'];
const config = require(__dirname + '/../config/config.js')[env];
var db = {};

var sequelize = new Sequelize(config.database, config.username, config.password, config);
// var roleModel = role(sequelize, DataTypes);
// var positionModel = position(sequelize, DataTypes);
var userModel = user(sequelize, DataTypes);
var mesinModel = mesin(sequelize, DataTypes);
// var branchModel = branch(sequelize, DataTypes);
// var repairerModel = repairer(sequelize, DataTypes);
// var alatanModel = alatan(sequelize, DataTypes);
// var detailalatanModel = detailalatan(sequelize, DataTypes);
// var jenisModel = jenis(sequelize, DataTypes);
// var lainModel = lain(sequelize, DataTypes);
// var kategoriModel = kategori(sequelize, DataTypes);
// var jenamaModel = jenama(sequelize, DataTypes);
// var paymentsModel = payments(sequelize,DataTypes);
// var auditTrailModel = auditTrails(sequelize, DataTypes);


// userModel.belongsTo(roleModel, {foreignKey: 'role_id', as: 'role'});
// userModel.belongsTo(positionModel, {foreignKey: 'position_id', as: 'position'});
// userModel.belongsTo(branchModel, {foreignKey: 'branch_id', as: 'branch'});
// detailalatanModel.belongsTo(alatanModel, {foreignKey: 'alatan_id', as: 'alatan', through: 'Detailalatan'});
// lainModel.belongsTo(jenisModel, {foreignKey: 'jenis_id', as: 'jenis'});
// kategoriModel.belongsTo(lainModel, {foreignKey: 'lain_id', as: 'lain'});
// alatanModel.belongsTo(repairerModel, {foreignKey: 'repairer_id', as: 'repairer'});
// detailalatanModel.belongsTo(ownerModel, {foreignKey: 'owner_id', as: 'owner'});
// detailalatanModel.belongsTo(kategoriModel, {foreignKey: 'kategori_id', as: 'kategori'});
// alatanModel.belongsTo(userModel, {foreignKey: 'user_id', as: 'user'});
// alatanModel.hasMany(detailalatanModel, {as: 'alatan', foreignKey: 'alatan_id'})
// paymentsModel.belongsTo(alatanModel, {foreignKey: 'alatan_id', as: 'alatan'})

// detailalatanModel.belongsTo(userModel, {foreignKey: 'user_id', as: 'user'});
// auditTrailModel.belongsTo(userModel, { foreignKey: 'user_id', as: 'user'})

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.Role = roleModel;
// db.Position = positionModel;
db.User = userModel;
db.Mesin = mesinModel;
// db.Repairer = repairerModel;
// db.Alatan = alatanModel;
// db.Detailalatan = detailalatanModel;
// db.Branch = branchModel;
// db.Jenis = jenisModel;
// db.Lain = lainModel;
// db.Kategori = kategoriModel;
// db.Jenama = jenamaModel;
// db.Payment = paymentsModel;
// db.AuditTrail = auditTrailModel;

module.exports = db;
