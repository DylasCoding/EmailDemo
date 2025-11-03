// javascript
import { Model } from 'sequelize';
import { encrypt, decrypt } from '../src/utils/crypto.js';

export default (sequelize, DataTypes) => {
    class EmailMessage extends Model {
        static associate(models) {
            EmailMessage.belongsTo(models.User, {
                foreignKey: 'senderId',
                as: 'sender'
            });
            EmailMessage.belongsTo(models.User, {
                foreignKey: 'recipientId',
                as: 'recipient'
            });
        }

        // getters decrypt stored values
        get subject() {
            const val = this.getDataValue('subject');
            return val == null ? val : decrypt(val);
        }

        get body() {
            const val = this.getDataValue('body');
            return val == null ? val : decrypt(val);
        }
    }

    EmailMessage.init({
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
            set(value) {
                this.setDataValue('subject', value == null ? value : encrypt(value));
            }
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
            set(value) {
                this.setDataValue('body', value == null ? value : encrypt(value));
            }
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'EmailMessage',
        tableName: 'EmailMessages',
        timestamps: true
    });

    return EmailMessage;
};
