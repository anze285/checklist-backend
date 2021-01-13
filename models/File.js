const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const FileSchema = new Schema({
    url: {
        type: Number,
        required: false
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    Item: {
        type: mongoose.Types.ObjectId,
        ref: 'Item'
    }
})

const File = mongoose.model('File', FileSchema)
module.exports = File