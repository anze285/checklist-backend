const Item = require('../models/Item')

const config = require('../config/config')

module.exports = {

    async all(req, res) {
        try {
            let listItems = []
            const lists = await Item.find({
                parentItem: req.body.parentItem
            })

            for (let x = 0; x < lists.length; x++) {
                const items = await Item.find({
                    parentItem: lists[x]._id
                });
                listItems.push({
                    list: lists[x],
                    items: items
                })
            }

            res.status(200).json({
                items: listItems
            })

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
                owner: req.user.id,
                status
            });

            let newItem = await item.save()

            const updateItem = await Item.findById(req.body.parentItem)
            updateItem.children.push(newItem._id)
            await updateItem.save()

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
    async updateListItems(req, res) {
        try {
            const {
                newList
            } = req.body

            const oldList = await Item.updateOne({
                children: req.params.id
            }, {
                $pullAll: {
                    children: [req.params.id]
                }
            })

            const updatedList = await Item.findById(newList._id)
            updatedList.children = newList.children
            updatedList.save()

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

            if (item !== null) {
                if (item.owner == req.user.id) {
                    
                    const item = await Item.findById(req.params.id).populate({path: 'children'})

                    item.children.forEach(async function(object){
                        const deletedObject = await Item.findByIdAndDelete(object._id)
                    })
                    const deleteItem = await Item.findByIdAndDelete(item._id)
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