import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class MailThread extends Model {
        static associate(models) {
            MailThread.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
            MailThread.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' });
            MailThread.hasMany(models.MailMessage, { foreignKey: 'threadId', as: 'messages' });

            this.hasMany(models.MailThreadStatus, { foreignKey: 'threadId', as: 'statuses' });
        }
    }

    MailThread.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        class: {
            type: DataTypes.ENUM('normal', 'spam', 'star'),
            defaultValue: 'normal'
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        isExternal:{
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    }, {
        sequelize,
        modelName: 'MailThread',
        tableName: 'MailThreads'
    });

    return MailThread;
};
