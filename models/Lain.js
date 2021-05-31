'use strict';
module.exports = (sequelize, DataTypes) => {
    var Lain = sequelize.define('Lain', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: true},
        no: {type: DataTypes.STRING, allowNull: true},
        jenis_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Jenis',
                key: 'id'
            }
        },

    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return Lain;

};
