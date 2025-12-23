import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class CalendarEvent extends Model {
        static associate(models) {
            CalendarEvent.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE'
            });
        }
    }

    CalendarEvent.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        color:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue : 0
        },
        note:{
            type: DataTypes.STRING,
            allowNull: true
        },
        start: {
            type: DataTypes.STRING,
            allowNull: false
        },
        end: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date:{
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'CalendarEvent',
        tableName: 'CalendarEvents',
        timestamps: false
    });

    return CalendarEvent;
};
