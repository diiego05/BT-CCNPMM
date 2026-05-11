const connection = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const saltRounds = 10;

const createUserService = async (name, email, password) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) return { EC: 1, EM: 'Email da ton tai' };

        const hashPassword = await bcrypt.hash(password, saltRounds);
        await connection.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashPassword, 'User']);
        return { EC: 0, EM: 'Tao tai khoan thanh cong' };
    } catch (error) {
        console.log('[createUserService error]', error.message);
        return { EC: -1, EM: 'Loi server: ' + error.message };
    }
};

const loginService = async (email, password) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return { EC: 1, EM: 'Email hoac Password khong hop le' };

        const user = rows[0];
        const isMatchPassword = await bcrypt.compare(password, user.password);
        if (!isMatchPassword) return { EC: 2, EM: 'Email hoac Password khong hop le' };

        const payload = { email: user.email, name: user.name };
        const access_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        return { EC: 0, access_token, user: { email: user.email, name: user.name } };
    } catch (error) {
        console.log('[loginService error]', error.message);
        return { EC: -1, EM: 'Loi server: ' + error.message };
    }
};

const getUserService = async () => {
    try {
        const [rows] = await connection.execute('SELECT id, name, email, role FROM users');
        return rows;
    } catch (error) {
        console.log('[getUserService error]', error.message);
        return null;
    }
};

const forgotPasswordService = async (email, newPassword) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return { EC: 1, EM: 'Email khong ton tai' };

        const hashPassword = await bcrypt.hash(newPassword, saltRounds);
        await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hashPassword, email]);
        return { EC: 0, EM: 'Doi mat khau thanh cong' };
    } catch (error) {
        console.log('[forgotPasswordService error]', error.message);
        return { EC: -1, EM: 'Loi server: ' + error.message };
    }
};

module.exports = { createUserService, loginService, getUserService, forgotPasswordService };