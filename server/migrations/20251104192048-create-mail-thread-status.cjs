'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('MailThreadStatus', {
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
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            class: {
                type: Sequelize.ENUM('normal', 'spam', 'star'),
                defaultValue: 'normal'
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
        await queryInterface.dropTable('MailThreadStatus');
    }
};
