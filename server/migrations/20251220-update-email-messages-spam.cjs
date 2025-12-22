'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'MailMessages',
            'spam',
            {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'MailMessages',
            'spam'
        );
    }
};
