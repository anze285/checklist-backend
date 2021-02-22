const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const StatusSchema = new Schema({
    name: {
        type: String,
        required: true
    }
})

const Status = mongoose.model('Status', StatusSchema)
module.exports = Status