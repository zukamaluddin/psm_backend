'use strict';
module.exports = (sequelize, DataTypes) => {
    var Tugasan = sequelize.define('Tugasan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {type: DataTypes.STRING, allowNull: true},
        dateStart: {type: DataTypes.STRING, allowNull: true},
        dateEnd: {type: DataTypes.STRING, allowNull: true},
        description: {type: DataTypes.STRING, allowNull: true},
        status: {type: DataTypes.STRING, allowNull: true},
        report: {type: DataTypes.STRING, allowNull: true},
        createdBy: {type: DataTypes.STRING, allowNull: true},
        isDeleted: {type: DataTypes.BOOLEAN, defaultValue: false},
        sort: {type: DataTypes.STRING(10), allowNull: true}
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    return Tugasan;
};