    const mongoose = require('mongoose')
    const Schema = mongoose.Schema;

    const TokenJWTSchema = new Schema({
        access_token: {
            type: String,
            required: true
        },
        refresh_token: {
            type: String,
            required: true
        },
        scope: {
            type: String,
            required: true
        },
        token_type: {
            type: String,
            required: true
        },
        expiry_date: {
            type: String,
            required: true
        },
        folder_id: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: 'User'
        },
    })

    const TokenJWT = mongoose.model('TokenJWT', TokenJWTSchema)
    module.exports = TokenJWT