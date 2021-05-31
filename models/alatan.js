'use strict';
module.exports = (sequelize, DataTypes) => {
    var Alatan = sequelize.define('Alatan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        tempat: {type: DataTypes.STRING, allowNull: true},
        jenistempat: {type: DataTypes.STRING, allowNull: true},
        resit: {type: DataTypes.STRING, allowNull: true},
        jenisresit: {type: DataTypes.STRING, allowNull: true},
        isdeleted: {type: DataTypes.BOOLEAN, defaultValue: false},
        ishantar: {type: DataTypes.BOOLEAN, defaultValue: false},
        tarikh: {type: DataTypes.DATE},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        tahun: {type: DataTypes.STRING, allowNull: true},
        borang: {type: DataTypes.BOOLEAN, defaultValue: false},
        codeCawangan: {type: DataTypes.STRING, allowNull: true},
        repairer_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Repairer',
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'User',
                key: 'id'
            }
        }

    }, {
        timestamps: false,
        freezeTableName: true,
    });
    Alatan.associate = (models) => {
        Alatan.belongsToMany(models.User, {
            through: 'Detailalatan',
            as: 'alatan',
            foreignKey: 'alatan_id'
        });
    };

    return Alatan;
};
