// File: server/src/controllers/userController.js
'use strict';

const { User } = require('../../models');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { decrypt } = require('../utils/crypto'); // decrypt incoming encrypted payload

const register = async (req, res, next) => {
    try {
        // Expect encrypted payload from client:
        // { firstName: <enc>, lastName: <enc>, email: <enc>, password: <enc> }
        const { firstName: firstEnc, lastName: lastEnc, email: emailEnc, password: passwordEnc } = req.body;

        if (!firstEnc || !lastEnc || !emailEnc || !passwordEnc) {
            return res.status(400).json({ error: 'Missing required encrypted fields' });
        }

        // Validate email format by decrypting it server-side
        const emailPlain = decrypt(emailEnc);
        if (!validator.isEmail(emailPlain)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check uniqueness using encrypted email directly (DB stores encrypted)
        const existingUser = await User.findOne({ where: { email: emailEnc } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Decrypt password (client encrypted it) so hooks can hash it
        const passwordPlain = decrypt(passwordEnc);

        // Build instance and set encrypted fields directly to avoid double encryption
        const user = User.build({}, { isNewRecord: true });
        user.setDataValue('firstName', firstEnc);
        user.setDataValue('lastName', lastEnc);
        user.setDataValue('email', emailEnc);
        // set plaintext password so beforeCreate hook will hash it
        user.setDataValue('password', passwordPlain);

        await user.save();

        // Return decrypted fields (model getters decrypt) and id
        res.status(201).json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        // Expect: { email: <enc>, password: <enc> }
        const { email: emailEnc, password: passwordEnc } = req.body;
        if (!emailEnc || !passwordEnc) {
            return res.status(400).json({ error: 'Missing required encrypted fields' });
        }

        // Find by encrypted email (DB stores encrypted)
        const user = await User.findOne({ where: { email: emailEnc } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Decrypt incoming password then compare with hashed password
        const passwordPlain = decrypt(passwordEnc);
        const isMatch = await user.comparePassword(passwordPlain);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT (email getter decrypts the stored email)
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};
