import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class UserDeleteThread extends Model {
        static associate(models) {
            UserDeleteThread.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE'
            });
            UserDeleteThread.belongsTo(models.MailThread, { foreignKey: 'threadId', as: 'thread' });
        }
    }

    UserDeleteThread.init({
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
        isDeleteForever: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'UserDeleteThread',
        tableName: 'UserDeleteThreads',
    });

    return UserDeleteThread;
};
