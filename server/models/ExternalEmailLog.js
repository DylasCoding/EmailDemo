import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class ExternalEmailLog extends Model {
        static associate(models) {
            ExternalEmailLog.belongsTo(models.MailMessage, {
                foreignKey: 'messageId',
                as: 'message',
                onDelete: 'CASCADE'
            });
        }
    }

    ExternalEmailLog.init({
        messageId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        receiverEmail : {
            type: DataTypes.STRING,
            allowNull: false
        },
        trackingToken:{
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'sent', 'failed'),
            defaultValue: 'pending'
        },
    }, {
        sequelize,
        modelName: 'ExternalEmailLog',
        tableName: 'ExternalEmailLogs',
        timestamps: true
    });

    return ExternalEmailLog;
};
