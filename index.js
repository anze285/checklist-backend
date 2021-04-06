require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const passport = require('passport')
const passportMiddleware = require('./middleware/passport')

const config = require('./config/config');

mongoose.connect(config.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // useCreateIndex: true,
    // useFindAndModify: false
});

const app = express();
app.use(cors())
app.use(passport.initialize())
passport.use(passportMiddleware)

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

//ROUTES//

const user = require('./routes/user')
const project = require('./routes/project')
const item = require('./routes/item')
const status = require('./routes/status')

app.use("/api/user", user)
app.use("/api/project", project)
app.use("/api/item", item)
app.use("/api/status", status)

//OAUTH2CALLBACK

app.use("/oauth2callback", require('./oauth2callback'))
app.use("/ds", require("./routes/drivesinhronization"))
//app.use("/google", require("./google"))

//LISTENING//

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log('server has started on port ' + port);
});