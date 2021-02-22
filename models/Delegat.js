const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const DelegatSchema = new Schema({
    dateAdd: {
        type: Date,
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

const Delegat = mongoose.model('Delegat', DelegatSchema)
module.exports = Delegat