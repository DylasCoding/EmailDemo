'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Files', {
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
            fileName: {
                type: Sequelize.STRING,
                allowNull: false
            },
            filePath: {
                type: Sequelize.STRING,
                allowNull: false
            },
            fileSize: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            mimeType: {
                type: Sequelize.STRING,
                allowNull: false
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
        await queryInterface.dropTable('Files');
    }
};
