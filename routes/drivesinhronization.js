const express = require("express");
const router = express.Router();

const passport = require("passport")

const Item = require('../models/Item')

const async = require('async');

const fs = require('fs');
const readline = require('readline');
const {
    google
} = require('googleapis');
const url = require("url");
const {
    ContextHandlerImpl
} = require("express-validator/src/chain");

let Items = [];

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

router.get("/", async (req, res) => {
    // Load client secrets from a local file.
    const items = await Item.find({
        owner: "606398b22f7dd2424c61a931",
        parentItem: null
    });
    //Items += items;
    Items.push({
        items: items
    })
    for (let x = 0; x < items.length; x++) {
        const elements = await Item.find({
            parentItem: items[x]._id
        });
        //Items += elements

        Items.push({
            items: elements
        })
        for (let y = 0; y < elements.length; y++) {
            const objects = await Item.find({
                parentItem: elements[y]._id
            })
            //Items += objects
            Items.push({
                items: objects
            })
        }
    }

    fs.readFile('credentials.json', (err, content) => {
        if (err) return res.send('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), res);
    });
})

function authorize(credentials, res) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return res.send({
            message: "Error retrieving token"
        });
        oAuth2Client.setCredentials(JSON.parse(token));
        synchronize(oAuth2Client, JSON.parse(token));
        //res.redirect(oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, }));
        res.sendStatus(200)
    });
}

function synchronize(auth, token) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    let ids = []
    console.log(Items[0].items.length)
    for (let x = 0; x < Items.length; x++) {
        for (let y = 0; y < Items[x].items.length; y++) {
            let itemId = [];
            if (Items[x].items[y].parentItem) {
                if (ids.length > 0) {
                    itemId = ids.map(id => {
                        console.log(id.item_id)
                        console.log("next one")
                        console.log(Items[x].items[y]._id)
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
                    //console.log(ids)
                }
            }).then(()=> {})
            
        }
    }
}

/*function mapa(auth, token) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    var fileMetadata = {
        'name': 'folder',
        'mimeType': 'application/vnd.google-apps.folder',
        parents: [token.folder_id]
    };
    drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('File Id: ', file.data.id);
        }
    });
}*/

module.exports = router;