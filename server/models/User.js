import { Model } from 'sequelize';
import { encrypt, decrypt, hashPassword, comparePassword as comparePasswordFn } from '../src/utils/crypto.js';

export default (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // Threads (sender / receiver)
            this.hasMany(models.MailThread, { foreignKey: 'senderId', as: 'sentThreads' });
            this.hasMany(models.MailThread, { foreignKey: 'receiverId', as: 'receivedThreads' });

            // Messages
            this.hasMany(models.MailMessage, { foreignKey: 'senderId', as: 'sentMessages' });
        }

        async comparePassword(password) {
            return await comparePasswordFn(password, this.password);
        }

        get firstName() {
            const val = this.getDataValue('firstName');
            return val == null ? val : decrypt(val);
        }

        get lastName() {
            const val = this.getDataValue('lastName');
            return val == null ? val : decrypt(val);
        }

        get email() {
            const val = this.getDataValue('email');
            return val == null ? val : decrypt(val);
        }
    }

    User.init({
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
            set(value) {
                this.setDataValue('firstName', value == null ? value : encrypt(value));
            }
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
            set(value) {
                this.setDataValue('lastName', value == null ? value : encrypt(value));
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                async isUnique(value) {
                    const user = await User.findOne({ where: { email: encrypt(value) } });
                    if (user) throw new Error('Email already exists');
                }
            },
            set(value) {
                this.setDataValue('email', value == null ? value : encrypt(value));
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: encrypt('password'),
            set(value) {
                this.setDataValue('password', value);
            }
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) user.password = await hashPassword(user.password);
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) user.password = await hashPassword(user.password);
            }
        }
    });

    return User;
};
