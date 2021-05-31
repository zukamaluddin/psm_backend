'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Repairer', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: true},
        noRocRob: {type: DataTypes.STRING, allowNull: true, unique: true},
        address: {type: DataTypes.STRING, allowNull: true, unique: true},
        streetAddressNo: {type: DataTypes.STRING, allowNull: true},
        placeArea: {type: DataTypes.STRING, allowNull: true},
        state: {type: DataTypes.STRING, allowNull: true},
        district: {type: DataTypes.STRING(100), allowNull: true},
        telNo: {type: DataTypes.STRING(100), allowNull: true},
        lesenNo: {type: DataTypes.STRING, allowNull: true},
        statusBayaran: {type: DataTypes.STRING, allowNull: true},
        agency: {type: DataTypes.STRING(50), allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        created_by: {type: DataTypes.STRING(36), allowNull: true},
        isDeleted: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true},
        is_bukku: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true},
        bukku_id: {type: DataTypes.STRING, allowNull: true},
        codeid: {type: DataTypes.STRING, allowNull: true},
    }, {
        timestamps: false,
        freezeTableName: true,
    });

};
