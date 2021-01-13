require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors')

mongoose.connect(config.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // useCreateIndex: true,
    // useFindAndModify: false
});


const app = express();
app.use(cors())
app.use(express.json());

//ROUTES//

//LISTENING//
const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log('server has started on port ' + port);
});