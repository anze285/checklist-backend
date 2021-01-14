const User = require('../models/User')

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
    validationResult
} = require("express-validator");

const config = require('../config/config')

function jwtSignUser(user) {
    return jwt.sign({
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname
    }, config.jwtSecret, {
        subject: `${user._id}`,
        expiresIn: 86400
    })
}

module.exports = {

    async register(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const {
            name,
            surname,
            username,
            email,
            password,
        } = req.body;
        try {
            let user = await User.findOne({
                email
            });
            if (user) {
                return res.status(400).json({
                    msg: "User Already Exists"
                });
            }

            user = new User({
                name,
                surname,
                username,
                email,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            return res.status(200).json({
                token: jwtSignUser(user)
            })

        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    },

    async login(req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const {
            email,
            password
        } = req.body;
        try {
            let user = await User.findOne({
                email
            });
            if (!user)
                return res.status(400).json({
                    message: "User with that email doesn't exist."
                });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({
                    message: "Incorrect Password."
                });

            return res.status(200).json({
                token: jwtSignUser(user)
            })

        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    },
    async getUser(req, res) {
        try {
            const user = await User.findOne({
                _id: req.user.id
            }, {
                "password": 0
            });
            res.json({
                user: {
                    user
                }
            });
        } catch (e) {
            res.send({
                message: "Error fetching user"
            });
        }
    },
}