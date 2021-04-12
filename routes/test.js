for (let x = 0; x < Items.length; x++) {
        for (let y = 0; y < Items[x].items.length; y++) {
            let itemId = [];
            if (Items[x].items[y].parentItem) {
                if (ids.length > 0) {
                    itemId = ids.map(id => {
                        if (id.item_id == Items[x].items[y]._id) {
                            return id.folder_id
                        } else {
                            return null
                        }
                    });
                }
            } else {
                itemId.push(token.folder_id);
            }

            var fileMetadata = {
                'name': Items[x].items[y].title,
                'mimeType': 'application/vnd.google-apps.folder',
                parents: [itemId[0]]
            };
            itemId = []
            drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            }, function (err, file) {
                if (err) {
                    // Handle error
                    console.error(err);
                } else {
                    console.log('Folder Id: ', file.data.id);
                    ids.push({
                        item_id: Items[x].items[y]._id,
                        folder_id: file.data.id
                    })
                    //consolelog()
                }
                consolelog()
            })
        }
    }