'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1) Thêm cột threadId cho phép null
        await queryInterface.addColumn('ExternalEmailLogs', 'threadId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'messageId' // Đặt sau cột messageId
        });

        // 2) Copy dữ liệu từ messageId sang threadId
        // Sử dụng queryInterface.sequelize.query để chạy SQL thuần
        await queryInterface.sequelize.query(
            'UPDATE `ExternalEmailLogs` SET `threadId` = `messageId` WHERE `messageId` IS NOT NULL'
        );
    },

    async down(queryInterface, Sequelize) {
        // Xóa cột threadId khi thực hiện rollback
        await queryInterface.removeColumn('ExternalEmailLogs', 'threadId');
    }
};