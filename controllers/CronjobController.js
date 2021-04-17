const {
    searchconsole
} = require('googleapis/build/src/apis/searchconsole');
let cron = require('node-cron');

const Item = require('../models/Item')
const User = require('../models/User')


module.exports = {
    weeklyReport() {
        cron.schedule('* 30 7 * * 1', () => {
            console.log('Running every Monday 7.30')
        })
        cron.schedule('* * * * *', () => {
            console.log("hey")
        })
        //nekineki()
    }
}

async function nekineki() {
    const users = await User.find()
    projectsLength = 0;
    itemsLength = 0;
    objectsLength = 0;
    users.forEach(async function (user) {
        const items = await Item.find({
            owner: user._id,
            parentItem: null
        }).populate('parentItem')

        console.log(items)
        /*async function readFromDatabase() {
            const projects = await Item.find({
                owner: user._id,
                parentItem: null
            })
            projectsLength += projects.length
            await projects.forEach(async function (project) {
                console.log(project._id)
                const items = await Item.find({
                    owner: user._id,
                    parentItem: project._id
                })
                console.log("Item " + items.length)
                itemsLength += items.length
                items.forEach(async function (item) {
                    console.log(user.username + " " + item._id)
                    const objects = await Item.find({
                        owner: user._id,
                        parentItem: item._id
                    })
                    objectsLength += objects.length
                })
            })
        }*/
        /*await readFromDatabase()
        await console.log(user.username)
        //console.log(projectsLength)
        await console.log(itemsLength)
        //console.log(objectsLength)*/

    })
}