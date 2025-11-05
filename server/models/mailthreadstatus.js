// server/models/mailthreadstatus.js
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class MailThreadStatus extends Model {
        static associate(models) {
            MailThreadStatus.belongsTo(models.MailThread, { foreignKey: 'threadId', as: 'thread' });
            MailThreadStatus.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }

    MailThreadStatus.init({
        threadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'MailThreads',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        class: {
            type: DataTypes.ENUM('normal', 'spam', 'star'),
            defaultValue: 'normal'
        }
    }, {
        sequelize,
        modelName: 'MailThreadStatus',
        tableName: 'MailThreadStatus',
        timestamps: true
    });

    return MailThreadStatus;
};
