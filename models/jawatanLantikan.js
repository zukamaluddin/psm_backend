'use strict';
module.exports = (sequelize, DataTypes) => {
    var JawatanLantikan = sequelize.define('JawatanLantikan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: true},
        sort: {type: DataTypes.STRING(10), allowNull: true}
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    return JawatanLantikan;
};