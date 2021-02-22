const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    tags: {
        type: String,
        required: false
    },
    deadline: {
        type: Date,
        required: false
    },
    parentItem: {
        type: mongoose.Types.ObjectId,
        ref: 'Item'
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: mongoose.Types.ObjectId,
        ref: 'Status'
    }
})

const Item = mongoose.model('Item', ItemSchema)
module.exports = Item