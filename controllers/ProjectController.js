const Item = require('../models/Item')
const Token = require('../models/Token')

const crypto = require('crypto');
const nodemailer = require('nodemailer')

const config = require('../config/config')

module.exports = {

    async all(req, res) {
        try {
            let userCreated = await Item.find({
                owner: req.user.id,
                project: true
            });
            if (!userCreated) {
                userCreated = null
            }
            const userInvited = await Item.find({
                project: true,
                users: req.user.id
            })
            res.json({
                items: userCreated,
                invited: userInvited
            })
        } catch (e) {
            res.send({
                msg: "Error fetching items",
                msg: req.user.id
            })
        }
    },
    async adminAll(req, res) {
        try {
        try {
            const projects = await Item.find({project: true}).populate('owner')
            res.json({
                projects: projects
            });
        } catch (e) {
            res.send({
                message: "Error fetching user"
            });
        }
        } catch (e) {
            res.send({
                msg: "Error fetching items",
                msg: req.user.id
            })
        }
    },
    async single(req, res) {
        try {
            const itemId = req.params.id
            const item = await Item.findById(itemId).populate({
                path: 'children',
                populate: {
                    path: 'children'
                }
            })
            const token = await Token.findOne({
                project: item._id
            })
            res.status(200).json({
                item: item,
                inviteLink: token.token
            })
        } catch (error) {
            res.send({
                msg: "Error fetching item"
            })
        }
    },
    async post(req, res) {
        try {
            const {
                title,
                description,
                tags,
                deadline,
                status
            } = req.body;

            const item = new Item({
                title,
                description,
                tags,
                deadline,
                project: true,
                dateAdd: new Date().getTime(),
                dateModify: new Date().getTime(),
                owner: req.user.id,
                status
            });

            await item.save()

            const token = new Token({
                token: crypto.randomBytes(16).toString('hex'),
                user: req.user.id,
                project: item._id
            })

            await token.save()

            res.status(200).json({
                msg: 'Successfuly added an item'
            })

        } catch (e) {
            res.send({
                message: "Error creating item"
            });
        }
    },
    async put(req, res) {
        try {
            const {
                title,
                description,
                tags,
                deadline,
                status,
            } = req.body;

            const updatedItem = await Item.findByIdAndUpdate(req.params.id, {
                title,
                description,
                tags,
                deadline,
                dateModify: new Date().getTime(),
                status
            }, {
                new: true,
                useFindAndModify: false
            })

            res.status(200).json({
                message: "Successfuly updated an item",
            })

        } catch (e) {
            res.send({
                message: "Error updating Item"
            });
            console.log(e)
        }
    },
    async delete(req, res) {
        try {
            const project = await Item.findById(req.params.id).populate({path: 'children', populate: { path: 'children' }})
            const user = req.user
            let admin = false
            user.roles.forEach(function (role){
                if(role.name == 'admin' ){
                    admin = true
                }
            })
            if (project !== null) {
                if (project.owner == req.user.id || admin) {
                    
                    project.children.forEach(async function (item) {
                        item.children.forEach(async function (object) {
                            const deletedObject = await Item.findByIdAndDelete(object._id)
                        })
                        const deleteItem = await Item.findByIdAndDelete(item._id)
                    })
                    const deletedProject = await Item.findByIdAndDelete(req.params.id)

                    res.status(200).json({
                        message: "Successfuly deleted an item"
                    })
                } else {
                    res.send({
                        message: "you are not owner of this item"
                    })
                }
            } else {
                res.send({
                    message: "item with this id does not exists"
                })
            }
        } catch (error) {
            res.send({
                message: "Error deleting item"
            });
        }
    },
    async inviteLink(req, res) {
        try {
            const token = await Token.findOne({
                token: req.params.inviteLink
            })
            const project = await Item.findById(token.project)

            if (req.user.id != project.owner) {
                const filteredUsers = project.users.filter(user => {
                    if (user == req.user.id) {
                        return user //Če prijavljen uporabnik še ni v Arrayu, vrni id uporabnika v projektu
                    }
                })

                if (filteredUsers.length > 0) {
                    res.status(400).json({
                        message: "Napaka. Ste že član tega projekta."
                    })
                } else {
                    if (req.user) {
                        project.users.push(req.user.id)
                        project.save()
                        res.status(200).json({
                            message: "Projektu ste uspešno dodali člana"
                        })
                    } else {
                        res.status(400).json({
                            message: "Napaka pri dodajanju člana v projekt. Poskusite ponovno kasneje."
                        })
                    }
                }
            } else {
                res.status(400).json({
                    message: "Napaka. Ste lastnik tega projekta."
                })
            }


        } catch (e) {
            res.send({
                message: "Napaka pri dodajanju uporabnika v projekt"
            })
            console.log(e)
        }
    },
    async multipleInvite(req, res) {
        try {
            const {
                projectId,
                emails
            } = req.body

            const token = await Token.findOne({
                project: projectId
            })

            const project = await Item.findById(projectId)


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
                    to: emails,
                    subject: "Bili ste povabljeni v projekt!",
                    html: `
                    <div>
                    <h2>${req.user.name} vam je poslal povabilo za pridružitev k projektu ${project.title}!</h2>
                    <p>Pridruži se s klikom na sledeči link: <a href=https://checky-app.herokuapp.com/projects/invite/${token.token}>Klikni tukaj</a></p>
                    </div>`,

                }) +
                res.status(200).json({
                    message: 'Povabilo je bilo uspešno poslano!'
                })
        } catch (error) {
            console.log(error)

        }
    },
}