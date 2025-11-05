'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1️⃣ Đổi tên bảng EmailMessages -> MailThreads (nếu muốn giữ dữ liệu)
        await queryInterface.renameTable('EmailMessages', 'MailThreads');

        // 2️⃣ Đổi tên hoặc xóa cột cũ không còn cần thiết
        await queryInterface.removeColumn('MailThreads', 'subject');
        await queryInterface.removeColumn('MailThreads', 'body');
        await queryInterface.removeColumn('MailThreads', 'sentAt');

        // 3️⃣ Đổi tên cột recipientId -> receiverId
        await queryInterface.renameColumn('MailThreads', 'recipientId', 'receiverId');

        // 4️⃣ Thêm các cột mới: title, class
        await queryInterface.addColumn('MailThreads', 'title', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });

        await queryInterface.addColumn('MailThreads', 'class', {
            type: Sequelize.ENUM('normal', 'spam', 'star'),
            defaultValue: 'normal'
        });
    },

    async down(queryInterface, Sequelize) {
        // Nếu rollback
        await queryInterface.renameTable('MailThreads', 'EmailMessages');
    }
};
