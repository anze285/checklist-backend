const User = require('../models/User')
const Token = require('../models/Token')
const Role = require('../models/Role')

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
    validationResult
} = require("express-validator");

const crypto = require('crypto');
const nodemailer = require('nodemailer')

const config = require('../config/config')

function jwtSignUser(user) {
    return jwt.sign({
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        active: user.active,
        roles: user.roles
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
            } else {
                user = new User({
                    name,
                    surname,
                    username,
                    email,
                    password,
                    dateAdd: new Date().getTime()
                });

                const role = await Role.findOne({
                    name: 'default'
                })

                user.roles.push(role._id)

                user.password = await bcrypt.hash(password, 10);

                await user.save();

                const token = new Token({
                    user: user._id,
                    token: crypto.randomBytes(16).toString('hex')
                });

                await token.save();

                const transport = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: config.nodemailer_user,
                        pass: config.nodemailer_pass,
                    },
                });

                if (process.env.NODE_ENV === 'production') {
                    transport.sendMail({
                        from: `"Checky ⚡️" <${config.nodemailer_user}>`,
                        to: user.email,
                        subject: "Prosimo, da potrdite vaš račun.",
                        html: `<h1>Potrditev e-poštnega naslova</h1>
                <h2>Pozdravljen ${user.username}!</h2>
                <p>Hvala za registracijo. Prosim potrdi račun s klikom na sledeči link: <a href=https://checky-app.herokuapp.com/verify/${token.token}>Klikni tukaj</a></p>
                </div>`,

                    })
                } else {
                    transport.sendMail({
                        from: `"Checky ⚡️" <${config.nodemailer_user}>`,
                        to: user.email,
                        subject: "Prosimo, da potrdite vaš račun.",
                        html: `<h1>Potrditev e-poštnega naslova</h1>
                <h2>Pozdravljen ${user.username}!</h2>
                <p>Hvala za registracijo. Prosim potrdi račun s klikom na sledeči link: <a href=http://localhost:8080/verify/${token.token}>Klikni tukaj</a></p>
                </div>`,
                    }).catch(err => console.log(err));
                }


                return res.status(200).json({
                    token: jwtSignUser(user)
                })

            }


        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    },

    async login(req, res) {

        const {
            email,
            password
        } = req.body;
        try {
            let user = await User.findOne({
                email
            }).populate({
                path: 'roles',
                model: 'Role'
            })
            console.log(user)
            if (!user)
                return res.status(400).json({
                    message: "Uporabnik s tem e-poštnim naslovom ne obstaja"
                });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({
                    message: "Napačni e-poštni naslov ali geslo"
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

    async verifyUser(req, res) {
        try {
            const token = await Token.findOne({
                token: req.params.confirmationCode
            })
            if (token) {
                const user = await User.findByIdAndUpdate(token.user, {
                    active: true,
                }, {
                    useFindAndModify: false
                })

                if (user) {
                    if (token) {
                        await Token.findByIdAndDelete(token._id)
                    }
                    res.send({
                        message: "Successfuly activated user",
                    })

                }

            } else {
                res.status(400).json({
                    message: 'Validation token is invalid'
                })
            }
        } catch (e) {
            console.log(e)
            res.status(500).json({
                message: "Server error"
            })
        }
    },

    async sendVerification(req, res) {
        try {
            const email = req.body.email
            const user = await User.findOne({
                email: email
            })
            const token = await Token.findOne({
                user: user._id,
                project: null
            })

            const transport = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: config.nodemailer_user,
                    pass: config.nodemailer_pass,
                },
            });
            transport.sendMail({
                from: `"Checky ⚡️" <${config.nodemailer_user}>`,
                to: user.email,
                subject: "Prosimo, da potrdite vaš račun.",
                html: `<h1>Potrditev e-poštnega naslova</h1>
                <h2>Pozdravljen ${user.username}!</h2>
                <p>Hvala za registracijo. Prosim potrdi račun s klikom na sledeči link: <a href=https://checky-app.herokuapp.com/verify/${token.token}>Klikni tukaj</a></p>
                </div>`,
            })

            res.status(200).json({
                message: 'Email je bil uspešno poslan.'
            })
        } catch (e) {
            console.log(e)
            res.status(500).json({
                message: "Server error"
            })
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
    async getUsers(req, res) {
        try {
            const users = await User.find().select({
                _id: 1,
                username: 1,
                email: 1,
                active: 1
            })
            res.json({
                users: users
            });
        } catch (e) {
            res.send({
                message: "Error fetching user"
            });
        }
    },
    async deleteUser(req, res) {
        try {
            const user = req.user
            let admin = false
            user.roles.forEach(function (role) {
                if (role.name == 'admin') {
                    admin = true
                }
            })
            if (admin) {
                const deleteUser = await User.findByIdAndDelete(req.params.id)
                res.json({
                    message: "Uspešno ste izbrisali uporabnika."
                });
            }
            else{
                res.json({
                    message: "Za izbris potrebujete pravice admina."
                });
            }

        } catch (e) {
            res.send({
                message: "Error fetching user"
            });
        }
    }
}