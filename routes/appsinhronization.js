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

// If modifying these scopes, delete token.json.
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

router.get("/", async (req, res) => {
    console.log("NEW REQUEST")
    // Load client secrets from a local file.
    const items = await Item.find({
        owner: "60753a34c79eb20004b1e6f7",
        parentItem: null
    });

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
        //call function
        readItems(oAuth2Client, JSON.parse(token))
        res.sendStatus(200)
    });
}

function readItems(auth, token) {
    const drive = google.drive({
        version: 'v3',
        auth
    });

    var pageToken = null;
    // Using the NPM module 'async'
    async.doWhilst(function (callback) {
        drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder'",
            q: "'" + token.folder_id + "' in parents",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            pageToken: pageToken
        }, function (err, res) {
            if (err) {
                // Handle error
                console.error(err);
                callback(err)
            } else {
                res.data.files.forEach(function (file) {
                    console.log("Found folder: " + file.name + " with id: " + file.id)
                });
                pageToken = res.nextPageToken;
                callback();
            }
        });
    }, function () {
        return !!pageToken;
    }, function (err) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            // All pages fetched
        }
    })
}

module.exports = router;