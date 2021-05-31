'use strict';
module.exports = (sequelize, DataTypes) => {
    var Jenama = sequelize.define('Jenama', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},

    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return Jenama;

};
