'use strict';
module.exports = (sequelize, DataTypes) => {
    var Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        alatan_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Alatan',
                key: 'id'
            }
        },
        data: {type: DataTypes.STRING(2000), allowNull: true},
        rujukanKewangan: {type: DataTypes.STRING(200), allowNull: true},
        jenisBayaran: {type: DataTypes.STRING(200), allowNull: true},
        kutipanBayaran: {type: DataTypes.STRING(200), allowNull: true},
        noCek: {type: DataTypes.STRING(200), allowNull: true},
        noRujukan: {type: DataTypes.STRING(200), allowNull: true},
        nameBank: {type: DataTypes.STRING(200), allowNull: true},
        invoiceTo: {type: DataTypes.STRING(200), allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        is_bukku: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true},
        bukku_id: {type: DataTypes.STRING, allowNull: true},
        is_deleted : {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true},
    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return Payment;

};
