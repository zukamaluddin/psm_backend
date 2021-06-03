'use strict';
module.exports = (sequelize, DataTypes) => {
    var Laporan = sequelize.define('Laporan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        month: {type: DataTypes.STRING, allowNull: true},
        year: {type: DataTypes.STRING, allowNull: true},
        batchNo: {type: DataTypes.STRING, allowNull: true},
        processName : {type: DataTypes.STRING, allowNull: true},
        cawangan: {type: DataTypes.STRING, allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        isdeleted: {type: DataTypes.BOOLEAN, defaultValue: false},
        isFinish: {type: DataTypes.BOOLEAN, defaultValue: false},
        mesin_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Mesin',
                key: 'id'
            }
        },
        created_by: {type: DataTypes.STRING(36), allowNull: true},
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    return Laporan;
};
