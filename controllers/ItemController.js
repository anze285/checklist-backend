const Item = require('../models/item')

const config = require('../config/config')

module.exports = {

    async all(req, res) {
        try {
            const items = await Item.find({parentItem: req.body.parentItem})
            res.status(200).json({
                items: items
            });
            // await Item.find({parentItem: req.body.parentItem}, function (err, results){
            //     if(err){
            //         res.send({
            //             items: []
            //         })
            //     }
                
            //     else{
            //         console.log("Dela" + results)
            //         res.json({
            //             items: results
            //         })
            //     }
            // });    
        } catch (e) {
            res.send({
                msg: "Error fetching items"
            })
        }
    },
    async single(req, res) {
        try {
            const itemId = req.params.id
            const item = await Item.findById(itemId)
            res.status(200).json({
                item: item
            })
        } catch (error) {
            res.send({
                msg: "Error fetching item"
            })
        }
    },
    async post(req, res) {
        try {
            console.log(req.body)
            const {
                title,
                description,
                tags,
                deadline,
                parentItem,
                status
            } = req.body;

            const item = new Item({
                title,
                description,
                tags,
                deadline,
                dateAdd: new Date().getTime(),
                dateModify: new Date().getTime(),
                parentItem,
                owner: req.user.id,
                status
            });
            
            await item.save()

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
            }, {new: true, useFindAndModify: false})

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
            const item = await Item.findById(req.params.id)

            if(item !== null){
                if(item.owner == req.user.id){
                    const deletedItem = await Item.findByIdAndDelete(req.params.id)
                    res.status(200).json({
                        message: "Successfuly deleted an item"
                    })
                }
                else{
                 res.send({
                    message: "you are not owner of this item"
                })   
                }
            }
            else {
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