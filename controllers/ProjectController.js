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
                parentItem: null
            });
            if (!userCreated) {
                userCreated = null
            }
            const userInvited = await Item.find({
                parentItem: null,
                users: req.user.id
            })
            console.log(userInvited)
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
    async single(req, res) {
        try {
            const itemId = req.params.id
            const item = await Item.findById(itemId)
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
                parentItem,
                owner,
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
                            message: "Successfuly added the user to the project"
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
                    <h2>${req.user.name} vam je poslal povabilo za pridružitev k projektu ${project.title}!</h2>
                    <p>Pridruži se s klikom na sledeči link: <a href=https://checky-app.herokuapp.com/project/invite/${token.token}>Klikni tukaj</a></p>
                    </div>`,
    
                })
+                
            res.status(200).json({
                message: 'Povabilo je bilo uspešno poslano!'
            })
        } catch (error) {
            console.log(error)
            
        }


    },
    async delete(req, res) {
        try {
            const item = await Item.findById(req.params.id)

            if (item !== null) {
                if (item.owner == req.user.id) {
                    // item.child.remove()
                    const deletedItem = await Item.findByIdAndDelete(req.params.id)
                    // const deletedLists = await Item.findOneAndDelete({parentItem: req.params.id})

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
    }
}