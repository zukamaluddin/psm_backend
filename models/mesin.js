'use strict';
module.exports = (sequelize, DataTypes) => {
    var Mesin = sequelize.define('Mesin', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cawangan: {type: DataTypes.STRING, allowNull: true},
        ibdNo: {type: DataTypes.STRING, allowNull: true},
        serialNo: {type: DataTypes.STRING, allowNull: true},
        rfidNo: {type: DataTypes.STRING, allowNull: true},
        // address: {type: DataTypes.STRING, allowNull: true},
        status: {type: DataTypes.STRING, allowNull: true},
    }, {
        freezeTableName: true,
    });

    return Mesin;
};
