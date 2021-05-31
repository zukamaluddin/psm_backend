'use strict';
module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: true},
        staffId: {type: DataTypes.STRING, allowNull: true},
        email: {type: DataTypes.STRING, allowNull: true, unique: true},
        password: {type: DataTypes.STRING, allowNull: true},
        phone: {type: DataTypes.STRING, allowNull: true},
        jawatan: {type: DataTypes.STRING, allowNull: true},
        cawangan: {type: DataTypes.STRING, allowNull: true},
        status: {type: DataTypes.STRING, allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return User;
};
