import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class File extends Model {
        static associate(models) {
            File.belongsTo(models.MailMessage, {
                foreignKey: 'messageId',
                as: 'message',
                onDelete: 'CASCADE'
            });
        }
    }

    File.init({
        messageId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'File',
        tableName: 'Files',
        timestamps: true
    });

    return File;
};
