import { Model } from 'sequelize';
import { encrypt, decrypt } from '../src/utils/crypto.js';

export default (sequelize, DataTypes) => {
    class MailMessage extends Model {
        static associate(models) {
            MailMessage.belongsTo(models.MailThread, { foreignKey: 'threadId', as: 'thread' });
            MailMessage.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });

            MailMessage.hasMany(models.File, {
                foreignKey: 'messageId',
                as: 'files'
            });
        }

        get body() {
            const val = this.getDataValue('body');
            return val == null ? val : decrypt(val);
        }
    }

    MailMessage.init({
        threadId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
            set(value) {
                this.setDataValue('body', value == null ? value : encrypt(value));
            }
        },
        isRead:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        sentAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'MailMessage',
        tableName: 'MailMessages',
        timestamps: true
    });

    return MailMessage;
};
