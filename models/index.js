'use strict';
var {Sequelize, DataTypes} = require('sequelize');

var user = require('./user');
var jawatan = require('./jawatan');
var cawangan = require('./cawangan');

var laporan = require('./laporan');
var process = require('./process');
var jenis = require('./jenis');

var mesin = require('./mesin');
var JawatanGenerik = require('./jawatanGenerik')
var JawatanGred = require('./jawatanGred')
var JawatanPentadbiran = require('./jawatanPentadbiran')
var JawatanLantikan = require('./jawatanLantikan')
var Lantikan = require('./lantikan')
var Tugasan = require('./tugasan')

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
var JawatanGenerikModel = JawatanGenerik(sequelize, DataTypes);
var JawatanGredModel = JawatanGred(sequelize, DataTypes);
var JawatanPentadbiranModel = JawatanPentadbiran(sequelize, DataTypes);
var JawatanLantikanModel = JawatanLantikan(sequelize, DataTypes);
var LantikanModel = Lantikan(sequelize, DataTypes);
var TugasanModel = Tugasan(sequelize, DataTypes);

laporanModel.hasMany(processModel, {as: 'laporan', foreignKey: 'laporan_id'})
laporanModel.belongsTo(mesinModel, {foreignKey: 'mesin_id', as: 'mesin'});
processModel.belongsTo(laporanModel, {foreignKey: 'laporan_id', as: 'laporan'});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = userModel;
db.Jawatan = jawatanModel;
db.Cawangan = cawanganModel;

db.Laporan = laporanModel;
db.Process = processModel;
db.Jenis = jenisModel;

db.Mesin = mesinModel;
db.JawatanGenerik = JawatanGenerikModel;
db.JawatanGred = JawatanGredModel;
db.JawatanPentadbiran = JawatanPentadbiranModel;
db.JawatanLantikan = JawatanLantikanModel;
db.Lantikan = LantikanModel;
db.Tugasan = TugasanModel;

module.exports = db;
