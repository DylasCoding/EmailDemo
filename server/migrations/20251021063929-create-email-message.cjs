'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('MailMessages', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            threadId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'MailThreads',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            senderId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            body: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            sentAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('MailMessages');
    }
};
