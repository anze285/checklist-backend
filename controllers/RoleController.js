const Role = require('../models/Role')

const config = require('../config/config')

module.exports = {

    async all(req, res) {
        try {
            const roles = await Role.find();
            res.json({
                roles: roles
            })
        } catch (e) {
            res.send({
                msg: "Error fetching roles"
            })
        }
    },
    async post(req, res) {
        try {

            const {
                name
            } = req.body;

            role = new Role({
                name
            })
            
            await role.save()

            res.status(200).json({
                msg: 'Successfuly added a role'
            })

        } catch (e) {
            res.send({
                message: "Error creating a role"
            });
        }
    },
}