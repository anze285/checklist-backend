require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET,
    db: process.env.MONGODB_URL
}