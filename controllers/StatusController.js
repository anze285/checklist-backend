const Status = require('../models/Status')

const config = require('../config/config')

module.exports = {

    async all(req, res) {
        try {
            const statuses = await Status.find();
            res.json({
                statuses: statuses
            })
        } catch (e) {
            res.send({
                msg: "Error fetching statuses"
            })
        }
    },
    async post(req, res) {
        try {

            const {
                name
            } = req.body;

            status = new Status({
                name
            })

            res.status(200).json({
                msg: 'Successfuly added a status'
            })

            await status.save()
        } catch (e) {
            res.send({
                message: "Error creating a status"
            });
        }
    },
}