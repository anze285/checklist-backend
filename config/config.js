require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET,
    db: process.env.MONGODB_URL,
    nodemailer_secret: process.env.NODEMAILER_SECRET,
    nodemailer_user: process.env.NODEMAILER_USER,
    nodemailer_pass: process.env.NODEMAILER_PASS,
}