'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Thêm dữ liệu vào bảng Users
        await queryInterface.bulkInsert('Users', [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: '123123',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                password: '123123',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'alice.johnson@example.com',
                password: '123',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});

        // Thêm dữ liệu vào bảng EmailMessages
        await queryInterface.bulkInsert('EmailMessages', [
            {
                senderId: 1, // John
                recipientId: 2, // Jane
                subject: 'Meeting Tomorrow',
                body: 'Hi Jane, can we meet tomorrow at 10 AM to discuss the project?',
                sentAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                senderId: 2, // Jane
                recipientId: 1, // John
                subject: 'Re: Meeting Tomorrow',
                body: 'Hi John, 10 AM works for me. See you then!',
                sentAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                senderId: 3, // Alice
                recipientId: 1, // John
                subject: 'Project Update',
                body: 'Hi John, I’ve updated the project timeline. Please review.',
                sentAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('EmailMessages', null, {});
        await queryInterface.bulkDelete('Users', null, {});
    }
};