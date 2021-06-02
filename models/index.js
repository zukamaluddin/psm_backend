'use strict';
var {Sequelize, DataTypes} = require('sequelize');

var user = require('./user');
var jawatan = require('./jawatan');
var cawangan = require('./cawangan');

var laporan = require('./laporan');
var process = require('./process');
var jenis = require('./jenis');

var mesin = require('./mesin');

const env = require(__dirname + '/../config/config.js')['environment'];
const config = require(__dirname + '/../config/config.js')[env];
var db = {};

var sequelize = new Sequelize(config.database, config.username, config.password, config);

var userModel = user(sequelize, DataTypes);
var jawatanModel = jawatan(sequelize, DataTypes);
var cawanganModel = cawangan(sequelize, DataTypes);

var laporanModel = laporan(sequelize, DataTypes);
var processModel = process(sequelize, DataTypes);
var jenisModel = jenis(sequelize, DataTypes);

var mesinModel = mesin(sequelize, DataTypes);

laporanModel.hasMany(processModel, {as: 'laporan', foreignKey: 'laporan_id'})
processModel.belongsTo(laporanModel, {foreignKey: 'alatan_id', as: 'laporan'});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = userModel;
db.Jawatan = jawatanModel;
db.Cawangan = cawanganModel;

db.Laporan = laporanModel;
db.Process = processModel;
db.Jenis = jenisModel;

db.Mesin = mesinModel;

module.exports = db;
