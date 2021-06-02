'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Process', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        processName: {type: DataTypes.STRING, allowNull: true},
        suhu: {type: DataTypes.STRING, allowNull: true},
        depan: {type: DataTypes.STRING, allowNull: true},
        tengah: {type: DataTypes.STRING, allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        date_submit: {type: DataTypes.DATE},
        created_by: {type: DataTypes.STRING(36), allowNull: true},
        laporan_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Laporan',
                key: 'id'
            }
        },
    }, {
        timestamps: false,
        freezeTableName: true, 
    });

};
