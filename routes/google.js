const express = require("express")
const {
    check
} = require("express-validator")
const router = express.Router()
const passport = require("passport")
const axios = require("axios")

const TokenJWT = require('../models/TokenJWT')



router.get("/connected", passport.authenticate("jwt", {
    session: false
}), async (req, res) => {

    const jwtToken = await TokenJWT.findOne({
        user: req.user.id
    })
    if(jwtToken){
        res.json({
            connected: true
        })
    }
    else{
        res.json({
            connected: false
        })
    }

})



module.exports = router;