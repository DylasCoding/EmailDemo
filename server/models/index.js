'use strict';

import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
import configFile from '../config/config.json' with { type: 'json' };
const config = configFile[env];
const db = {};

// Control logging via environment variable
config.logging = process.env.SEQ_LOG === 'true' ? console.log : false;

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js');

for (const file of files) {
    const filePath = path.join(__dirname, file);
    const fileUrl = pathToFileURL(filePath).href;
    const imported = await import(fileUrl);
    const modelFactory = imported.default || imported;
    const model = modelFactory(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export const User = db.User;
export const MailThread = db.MailThread;
export const MailMessage = db.MailMessage;
export const MailThreadStatus = db.MailThreadStatus;
export const File = db.File;
export const ExternalEmailLog = db.ExternalEmailLog;
export const CalendarEvent = db.CalendarEvent;
export const UserDeleteThread = db.UserDeleteThread;
export const sequelizeInstance = sequelize;

export default db;
