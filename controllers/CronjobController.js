const {
    searchconsole
} = require('googleapis/build/src/apis/searchconsole');
let cron = require('node-cron');

const Item = require('../models/Item')
const User = require('../models/User')
const config = require('../config/config')
const nodemailer = require('nodemailer')


module.exports = {
    weeklyReport() {
        cron.schedule('0 30 7 * * 2', () => {
            //weeklyReports()
        })
    },
    databaseCleaning() {
        cron.schedule('0 0 * * *', () => {
            deleteUnactivatedUsers()
        })
    }
}
async function deleteUnactivatedUsers() {
    const users = await User.find({
        active: false
    })
    users.forEach(async function (user) {
        newDate = new Date()
        oldDate = newDate.getDate() - 14
        newDate.setDate(oldDate)
        if (user.dateAdd < newDate){
            const deletedUser = await Item.findByIdAndDelete(user._id)
            console.log(user.email + " was deleted.")
        }
    })
}

async function weeklyReports() {
    newDate = new Date()
    oldDate = newDate.getDate() - 7
    newDate.setDate(oldDate)
    const users = await User.find()
    users.forEach(async function (user) {
        if (user.active) {
            projectsLength = 0;
            itemsLength = 0;
            objectsLength = 0;
            const projects = await Item.find({
                owner: user._id,
                project: true
            }).populate({
                path: 'children',
                populate: {
                    path: 'children'
                }
            })
            projects.forEach(async function (project) {
                if (project.dateModify > newDate) {
                    projectsLength++
                }
                project.children.forEach(async function (item) {
                    if (item.dateModify > newDate) {
                        itemsLength++
                    }
                    item.children.forEach(async function (object) {
                        if (object.dateModify > newDate) {
                            objectsLength++
                        }
                    })

                })
            })
            console.log(user.username)
            console.log(projectsLength + " " + itemsLength + " " + objectsLength)
            let message;
            if ((projectsLength + objectsLength + itemsLength) > 10) {
                messasge = "Ta teden ste bili zelo delavni, saj ste ustvarili ali posodobili, kar " + (projectsLength + objectsLength + itemsLength) + " opravil!💯"
            } else if ((projectsLength + objectsLength + itemsLength) == 0) {
                message = "Ta teden sploh niste bili dejavni, saj ste ustvarili ali posodobili " + (projectsLength + objectsLength + itemsLength) + " opravil! Vedi, da kdor ne dela naj ne je.💩💩💩"
            } else if ((projectsLength + objectsLength + itemsLength) == 1) {
                message = "Ta teden ste bili zelo slabo dejavni, saj ste ustvarili ali posodobili samo " + (projectsLength + objectsLength + itemsLength) + " opravilo! Res je, da pravijo, da se počasi daleč pride, ampak tega se ne sme vzeti dobesedno.😶"
            } else if ((projectsLength + objectsLength + itemsLength) == 2) {
                message = "Ta teden ste bili zelo nedejavni, saj ste ustvarili ali posodobili samo " + (projectsLength + objectsLength + itemsLength) + " opravili!😭"
            } else if ((projectsLength + objectsLength + itemsLength) > 2 && (projectsLength + objectsLength + itemsLength) < 5) {
                message = "Ta teden ste bili zelo nedejavni, saj ste ustvarili ali posodobili samo " + (projectsLength + objectsLength + itemsLength) + " opravila!😢"
            } else {
                message = "Ta teden ste bili delno dejavni, saj ste ustvarili ali posodobili " + (projectsLength + objectsLength + itemsLength) + " opravil!👍"
            }
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
                subject: "Tedensko poročilo aktivnosti",
                html: `
                    <div>
                    <h2>Tedensko poročilo aktivnosti</h2>
                    <p>${message}</p>
                    <h3>Natančno poročilo</h3>
                    <p>Število projektov, ki ste jih posodobili ali ustvarili ta teden: ${projectsLength}
                    <br> Število seznamov, ki ste jih posodobili ali ustvarili ta teden: ${itemsLength}
                    <br> Število opravil, ki ste jih posodobili ali ustvarili ta teden: ${objectsLength}</p>
                    </div>`,

            })
        } else {
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
                subject: "Aktivacija računa",
                html: `
                    <div>
                    <h2>Niste še aktivirali računa!</h2>
                    <p>Niste prejeli aktivacijske e-pošte? Ponovno aktivacijsko sporočilo lahko dobite s prijavo v aplikacijo.</p>
                    </div>`,
            })
        }

    })
}