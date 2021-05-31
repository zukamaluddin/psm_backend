'use strict';
module.exports = (sequelize, DataTypes) => {
    var Kategori = sequelize.define('Kategori', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: true},
        no: {type: DataTypes.STRING, allowNull: true},
        harga: {type: DataTypes.STRING, allowNull: true},
        lain_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Lain',
                key: 'id'
            }
        },

    }, {
        timestamps: false,
        freezeTableName: true,
    });

    return Kategori;

};
