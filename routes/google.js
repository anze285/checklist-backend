const express = require("express")
const {
    check
} = require("express-validator")
const router = express.Router()
const passport = require("passport")
const axios = require("axios")

router.get("/oauth2callback", passport.authenticate("jwt", {
    session: false
}), async (req, res) => {

    /*axios.get('oauth2callback', {
        headers: {
            Authorization: 'Bearer ' + req.user
        }
    })*/
    res.sendStatus(500)
})



module.exports = router;