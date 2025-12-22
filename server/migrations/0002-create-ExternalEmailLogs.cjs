'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ExternalEmailLogs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            messageId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'MailMessages',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            receiverEmail : {
                type: Sequelize.STRING,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'sent', 'failed'),
                defaultValue: 'pending'
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
        await queryInterface.dropTable('ExternalEmailLogs');
    }
};
