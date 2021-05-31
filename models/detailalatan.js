'use strict';
module.exports = (sequelize, DataTypes) => {
    var Detailalatan = sequelize.define('Detailalatan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        had: {type: DataTypes.STRING, allowNull: true},
        jenishad: {type: DataTypes.STRING, allowNull: true},
        jenama: {type: DataTypes.STRING, allowNull: true},
        siri: {type: DataTypes.STRING, allowNull: true},
        caj: {type: DataTypes.STRING, allowNull: true},
        tentusan: {type: DataTypes.STRING, allowNull: true},
        nombordaftar: {type: DataTypes.STRING, allowNull: true},
        nomborsijil: {type: DataTypes.STRING, allowNull: true},
        stikerbaru: {type: DataTypes.STRING, allowNull: true},
        jenisstikerbaru: {type: DataTypes.STRING, allowNull: true},
        stikerlama: {type: DataTypes.STRING, allowNull: true},
        jenisstikerlama: {type: DataTypes.STRING, allowNull: true},
        date_created: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        sijil: {type: DataTypes.BOOLEAN, defaultValue: false},
        alamatalatan: {type: DataTypes.STRING, allowNull: true},
        tarikh: {type: DataTypes.DATE},
        alatan_id: {
            type: DataTypes.UUID,
            onDelete:'CASCADE',
            references: {
                model: 'Alatan',
                key: 'id'
            }
        },
        kategori_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Kategori',
                key: 'id'
            }
        },owner_id: {
            type: DataTypes.UUID,
            onDelete: 'CASCADE',
            references: {
                model: 'Owner',
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

    return Detailalatan;
};
