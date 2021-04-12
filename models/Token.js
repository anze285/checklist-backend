const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    expireAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    project: {
        type: mongoose.Types.ObjectId,
        required: false,
        ref: 'Item'
    }

})

const Token = mongoose.model('Token', TokenSchema)
module.exports = Token