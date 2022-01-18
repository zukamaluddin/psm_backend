'use strict';
module.exports = (sequelize, DataTypes) => {
    var Lantikan = sequelize.define('Lantikan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        staffName: {type: DataTypes.STRING, allowNull: true},
        staffId: {type: DataTypes.STRING, allowNull: true},
        dateAssigned: {type: DataTypes.STRING, allowNull: true},
        dateStart: {type: DataTypes.STRING, allowNull: true},
        dateEnd: {type: DataTypes.STRING, allowNull: true},
        jawatanPentadbiran: {type: DataTypes.STRING, allowNull: true},
        jawatanGred: {type: DataTypes.STRING, allowNull: true},
        jawatanLantikan: {type: DataTypes.STRING, allowNull: true},
        jawatanGenerik: {type: DataTypes.STRING, allowNull: true},
        description: {type: DataTypes.STRING, allowNull: true},
        referenceNo: {type: DataTypes.STRING, allowNull: true},
        dateLetterLantikan: {type: DataTypes.STRING, allowNull: true},
        updatedBy: {type: DataTypes.STRING, allowNull: true},
        createdBy: {type: DataTypes.STRING, allowNull: true},
        isDeleted: {type: DataTypes.BOOLEAN, defaultValue: false},
        sort: {type: DataTypes.STRING(10), allowNull: true}
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    return Lantikan;
};