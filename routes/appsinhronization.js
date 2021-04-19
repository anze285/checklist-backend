const express = require("express");
const router = express.Router();

const passport = require("passport")

const Item = require('../models/Item')

const Token = require('../models/Token')
const crypto = require('crypto');

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
const User = require("../models/User");

// If modifying these scopes, delete token.json.
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

router.get("/", async (req, res) => {

    fs.readFile('credentials.json', (err, content) => {
        if (err) return res.send('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), res, "607d69858e6e9133f73a005c");
    });
})

function authorize(credentials, res, userId) {
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
        readProjects(oAuth2Client, JSON.parse(token), userId)
        res.sendStatus(200)
    });
}

function readProjects(auth, token, userId) {
    const drive = google.drive({
        version: 'v3',
        auth
    });

    var pageToken = null;
    // Using the NPM module 'async'
    async.doWhilst(function (callback) {
        drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and '" + token.folder_id + "' in parents",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            pageToken: pageToken
        }, function (err, res) {
            if (err) {
                // Handle error
                console.error(err);
                callback(err)
            } else {
                res.data.files.forEach(async function (projectFolder) {
                    //console.log("Found folder: " + file.name + " with id: " + file.id)
                    project = await Item.find({
                        owner: userId,
                        title: projectFolder.name
                    })
                    console.log(project.length)
                    if (project.length == 1) {
                        readItems(project[0], drive, projectFolder.id, userId)
                    } else if (project.length == 0) {

                        var filePageToken = null;
                        // Using the NPM module 'async'
                        async.doWhilst(function (fileCallback) {
                            drive.files.list({
                                q: "mimeType != 'application/vnd.google-apps.folder' and '" + projectFolder.id + "' in parents and name ='" + projectFolder.name + ".json'",
                                fields: 'nextPageToken, files(id, name)',
                                spaces: 'drive',
                                pageToken: filePageToken
                            }, function (err, resFile) {
                                if (err) {
                                    // Handle error
                                    console.error(err);
                                    fileCallback(err)
                                } else {
                                    console.log(resFile.data.files[0].id)

                                    let request = drive.files.get({
                                        fileId: resFile.data.files[0].id,
                                        alt: 'media'
                                    })
                                    request.then(async function (response) {
                                            //console.log(response.data); //response.data contains the string value of the file
                                            /*if (typeof callback === "function"){
                                                console.log(response.data);
                                            }*/
                                            const newProject = new Item({
                                                title: response.data.title,
                                                description: response.data.description,
                                                tags: response.data.tags,
                                                children: response.data.children,
                                                users: response.data.users,
                                                deadline: response.data.deadline,
                                                project: response.data.project,
                                                dateAdd: response.data.dateAdd,
                                                dateModify: response.data.dateModify,
                                                owner: userId,
                                                status: response.data.status
                                            });
                                            await newProject.save()

                                            const token = new Token({
                                                token: crypto.randomBytes(16).toString('hex'),
                                                user: response.data.owner,
                                                project: newProject._id
                                            })

                                            await token.save()

                                            readItems(newProject, drive, projectFolder.id, userId)
                                        },
                                        function (error) {
                                            console.error(error)
                                        })


                                    filePageToken = resFile.nextPageToken;
                                    fileCallback();
                                }
                            });
                        }, function () {
                            return !!filePageToken;
                        }, function (err) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                // All pages fetched
                            }
                        })

                    } else {
                        console.log("There are 2 folders with the same name")
                    }
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

function readItems(project, drive, projectId, userId) {
    var pageToken = null;
    // Using the NPM module 'async'
    async.doWhilst(function (callback) {
        drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and '" + projectId + "' in parents",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            pageToken: pageToken
        }, async function (err, res) {
            if (err) {
                // Handle error
                console.error(err);
                callback(err)
            } else {
                await res.data.files.forEach(async function (itemFolder) {
                    //console.log("Found folder: " + file.name + " with id: " + file.id)
                    item = await Item.find({
                        owner: userId,
                        title: itemFolder.name
                    })
                    console.log(item.length)
                    if (item.length == 1) {
                        readObjects(item[0], drive, itemFolder.id, userId)
                    } else if (item.length == 0) {

                        var filePageToken = null;
                        // Using the NPM module 'async'
                        async.doWhilst(function (fileCallback) {
                            drive.files.list({
                                q: "mimeType != 'application/vnd.google-apps.folder' and '" + itemFolder.id + "' in parents and name ='" + itemFolder.name + ".json'",
                                fields: 'nextPageToken, files(id, name)',
                                spaces: 'drive',
                                pageToken: filePageToken
                            }, async function (err, resFile) {
                                if (err) {
                                    // Handle error
                                    console.error(err);
                                    fileCallback(err)
                                } else {
                                    console.log(resFile.data.files[0].id)

                                    let request = drive.files.get({
                                        fileId: resFile.data.files[0].id,
                                        alt: 'media'
                                    })
                                    await request.then(async function (response) {
                                            //console.log(response.data); //response.data contains the string value of the file
                                            /*if (typeof callback === "function"){
                                                console.log(response.data);
                                            }*/
                                            const newItem = new Item({
                                                title: response.data.title,
                                                description: response.data.description,
                                                tags: response.data.tags,
                                                children: response.data.children,
                                                users: response.data.users,
                                                deadline: response.data.deadline,
                                                project: response.data.project,
                                                dateAdd: response.data.dateAdd,
                                                dateModify: response.data.dateModify,
                                                owner: userId,
                                                status: response.data.status
                                            });
                                            await newItem.save()
                                            console.log(project._id)
                                            parentProject = await Item.findById(project._id)
                                            console.log(parentProject)
                                            
                                            parentProject.children.push(newItem._id) //OLD IDS ARE NOT DELETED
                                            await parentProject.save()

                                            readObjects(newItem, drive, itemFolder.id, userId)
                                        },
                                        function (error) {
                                            console.error(error)
                                        })

                                    filePageToken = resFile.nextPageToken;
                                    fileCallback();
                                }
                            });
                        }, function () {
                            return !!filePageToken;
                        }, function (err) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                // All pages fetched
                            }
                        })

                    } else {
                        console.log("There are 2 folders with the same name")
                    }
                });
                await project.save()


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

function readObjects(item, drive, itemId, userId) {
    var pageToken = null;
    // Using the NPM module 'async'
    async.doWhilst(function (callback) {
        drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and '" + itemId + "' in parents",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            pageToken: pageToken
        }, async function (err, res) {
            if (err) {
                // Handle error
                console.error(err);
                callback(err)
            } else {
                await res.data.files.forEach(async function (objectFolder) {
                    //console.log("Found folder: " + file.name + " with id: " + file.id)
                    object = await Item.find({
                        owner: userId,
                        title: objectFolder.name
                    })
                    console.log(object.length)
                    if (object.length == 1) {
                        console.log(object[0].id)
                    } else if (object.length == 0) {

                        var filePageToken = null;
                        // Using the NPM module 'async'
                        async.doWhilst(function (fileCallback) {
                            drive.files.list({
                                q: "mimeType != 'application/vnd.google-apps.folder' and '" + objectFolder.id + "' in parents and name ='" + objectFolder.name + ".json'",
                                fields: 'nextPageToken, files(id, name)',
                                spaces: 'drive',
                                pageToken: filePageToken
                            }, async function (err, resFile) {
                                if (err) {
                                    // Handle error
                                    console.error(err);
                                    fileCallback(err)
                                } else {
                                    console.log(resFile.data.files[0].id)

                                    let request = drive.files.get({
                                        fileId: resFile.data.files[0].id,
                                        alt: 'media'
                                    })
                                    await request.then(async function (response) {
                                            //console.log(response.data); //response.data contains the string value of the file
                                            /*if (typeof callback === "function"){
                                                console.log(response.data);
                                            }*/
                                            const newObject = new Item({
                                                title: response.data.title,
                                                description: response.data.description,
                                                tags: response.data.tags,
                                                children: response.data.children,
                                                users: response.data.users,
                                                deadline: response.data.deadline,
                                                project: response.data.project,
                                                dateAdd: response.data.dateAdd,
                                                dateModify: response.data.dateModify,
                                                owner: userId,
                                                status: response.data.status
                                            });
                                            await newObject.save()
                                            parentItem = await Item.findById(item._id)
                                            console.log(parentItem)
                                            
                                            parentItem.children.push(newObject._id) //OLD IDS ARE NOT DELETED
                                            await parentItem.save()
                                        },
                                        function (error) {
                                            console.error(error)
                                        })

                                    filePageToken = resFile.nextPageToken;
                                    fileCallback();
                                }
                            });
                        }, function () {
                            return !!filePageToken;
                        }, function (err) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                // All pages fetched
                            }
                        })

                    } else {
                        console.log("There are 2 folders with the same name")
                    }
                });
                await project.save()


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