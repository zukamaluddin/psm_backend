'use strict';
module.exports = (sequelize, DataTypes) => {
    var Jenis = sequelize.define('Jenis', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        kegunaan: {type: DataTypes.STRING, allowNull: true},
        no: {type: DataTypes.STRING, allowNull: true},
        name: {type: DataTypes.STRING, allowNull: true},

    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return Jenis;

};
