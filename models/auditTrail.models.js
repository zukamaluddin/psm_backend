'use strict';
module.exports = (sequelize, DataTypes) => {
    var AuditTrail = sequelize.define('AuditTrail', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'User',
                key: 'id'
            }
        },
        path: {type: DataTypes.STRING(1000), allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return AuditTrail;

};
