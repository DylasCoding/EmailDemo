'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('CalendarEvents', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            color:{
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue : 0
            },
            note:{
                type: Sequelize.STRING,
                allowNull: true
            },
            start: {
                type: Sequelize.STRING,
                allowNull: false
            },
            end: {
                type: Sequelize.STRING,
                allowNull: false
            },
            date:{
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('CalendarEvents');
    }
};
