const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: {
        type: String,
        required: false
    },
    file: {
        type: String,
        required: false
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    item: {
        type: mongoose.Types.ObjectId,
        ref: 'Item'
    }
})

const Comment = mongoose.model('Comment', CommentSchema)
module.exports = Comment