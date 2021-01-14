const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();

const AuthenticationController = require('../controllers/AuthenticationController')

const passport = require('passport')

router.post(
    "/register",
    [
        check("name", "Please Enter a Valid Name")
        .not()
        .isEmpty(),
        check("surname", "Please Enter a Valid Surname")
        .not()
        .isEmpty(),
        check("username", "Please Enter a Valid Username")
        .not()
        .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    AuthenticationController.register
);

router.post(
    "/login",
    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    AuthenticationController.login
)

router.get("/me", passport.authenticate("jwt", {
    session: false
}), AuthenticationController.getUser);

module.exports = router;