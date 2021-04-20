const express = require("express");
const router = express.Router();

const passport = require("passport")

const Item = require('../models/Item')
const TokenJWT = require('../models/TokenJWT')

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

router.get("/", passport.authenticate("jwt", {
    session: false
}), async (req, res) => {

    fs.readFile('credentials.json', (err, content) => {
        if (err) return res.send('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), res, req);
    });
})

async function authorize(credentials, res, req) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.

      const jwtToken = await TokenJWT.findOne({
          user: req.user.id
      })

            try {
                if (jwtToken) {
                    oAuth2Client.setCredentials(jwtToken);
                    synchronize(oAuth2Client, jwtToken, req.user.id);
                    res.json({
                        message: 'Uspešen prenos podatkov na Google Drive'
                    })
                }
            } catch (error) {
                res.json({
                    error: error
                })
            }
    
        // if (err) return res.send({
        //     message: "Error retrieving token"
        // });
        // oAuth2Client.setCredentials(JSON.parse(token));
        // synchronizeOld(oAuth2Client, JSON.parse(token));
        // synchronize(oAuth2Client, JSON.parse(token), req.user.id);
        // res.redirect(oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, }));
        // res.sendStatus(200)
}

async function synchronize(auth, token, user_id) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    const projects = await Item.find({
        owner: user_id,
        project: true
    }).populate({
        path: 'children',
        populate: {
            path: 'children'
        }
    })
    projects.forEach(async function (project) {
        var projectPageToken = null;
        // Using the NPM module 'async'
        console.log(project)
        console.log(token.folder_id)
        async.doWhilst(function (projectCallback) {
            drive.files.list({
                q: "mimeType = 'application/vnd.google-apps.folder' and name='" + project.title + "'",
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive',
                pageToken: projectPageToken
            }, function (err, resProject) {
                if (err) {
                    // Handle error
                    console.error(err);
                    projectCallback(err)
                } else {
                    let projectFolderId;
                    console.log(resProject.data)
                    if (resProject.data.files[1]) {
                        console.log("ERROR: There are 2 folders with the same name")
                    }
                    if (resProject.data.files[0]) {
                        projectFolderId = resProject.data.files[0].id
                        synchronizeItems(project, drive, projectFolderId)
                    } else {
                        var projectFolderMetadata = {
                            'name': project.title,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [token.folder_id]
                        };
                        drive.files.create({
                            resource: projectFolderMetadata,
                            fields: 'id'
                        }, async function (err, projectFolder) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                //console.log("Project")
                                //console.log('Folder Id: ', file.data.id);
                                projectFolderId = projectFolder.data.id
                                synchronizeItems(project, drive, projectFolderId)
                                var projectFileMetadata = {
                                    'name': (project.title + ".json"),
                                    parents: [projectFolderId]
                                };
                                projectDetails = await Item.findById(project._id)
                                var projectFileMedia = {
                                    mimeType: 'application/json',
                                    body: JSON.stringify(projectDetails)
                                };
                                drive.files.create({
                                    resource: projectFileMetadata,
                                    media: projectFileMedia,
                                    fields: 'id'
                                }, function (err, projectFile) {
                                    if (err) {
                                        // Handle error
                                        console.error(err);
                                    } else {}
                                });
                            }
                        })
                    }
                    projectPageToken = resProject.nextPageToken;
                    projectCallback();
                }
            });
        }, function () {
            return !!projectPageToken;
        }, function (err) {
            if (err) {
                // Handle error
                console.error(err);
            } else {
                // All pages fetched
            }
        })
    })
}

function synchronizeItems(project, drive, projectFolderId) {
    project.children.forEach(async function (item) {
        var itemPageToken = null;
        // Using the NPM module 'async'
        async.doWhilst(function (itemCallback) {
            drive.files.list({
                q: "mimeType = 'application/vnd.google-apps.folder' and name='" + item.title + "'",
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive',
                pageToken: itemPageToken
            }, function (err, resItem) {
                if (err) {
                    // Handle error
                    console.error(err);
                    itemCallback(err)
                } else {
                    let itemFolderId;
                    if (resItem.data.files[1]) {
                        console.log("ERROR: There are 2 folders with the same name")
                    }
                    if (resItem.data.files[0]) {
                        itemFolderId = resItem.data.files[0].id
                        synchronizeObjects(item, drive, itemFolderId)
                    } else {
                        var itemFolderMetadata = {
                            'name': item.title,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [projectFolderId]
                        };
                        drive.files.create({
                            resource: itemFolderMetadata,
                            fields: 'id'
                        }, async function (err, itemFolder) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                //console.log("Item")
                                //console.log('Folder Id: ', file.data.id);
                                itemFolderId = itemFolder.data.id
                                synchronizeObjects(item, drive, itemFolderId)
                                var itemFileMetadata = {
                                    'name': (item.title + ".json"),
                                    parents: [itemFolderId]
                                };
                                itemDetails = await Item.findById(item._id)
                                var itemFileMedia = {
                                    mimeType: 'application/json',
                                    body: JSON.stringify(itemDetails)
                                };
                                drive.files.create({
                                    resource: itemFileMetadata,
                                    media: itemFileMedia,
                                    fields: 'id'
                                }, function (err, itemFile) {
                                    if (err) {
                                        // Handle error
                                        console.error(err);
                                    } else {}
                                });
                            }

                        })


                    }

                    itemPageToken = resItem.nextPageToken;
                    itemCallback();
                }
            });
        }, function () {
            return !!itemPageToken;
        }, function (err) {
            if (err) {
                // Handle error
                console.error(err);
            } else {
                // All pages fetched
            }
        })
    })
}

function synchronizeObjects(item, drive, itemFolderId) {
    item.children.forEach(async function (object) {
        var objectPageToken = null;
        // Using the NPM module 'async'
        async.doWhilst(function (objectCallback) {
            drive.files.list({
                q: "mimeType = 'application/vnd.google-apps.folder' and name='" + object.title + "'",
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive',
                pageToken: objectPageToken
            }, function (err, resObject) {
                if (err) {
                    // Handle error
                    console.error(err);
                    objectCallback(err)
                } else {
                    let objectFolderId;
                    if (resObject.data.files[1]) {
                        console.log("ERROR: There are 2 folders with the same name")
                    }
                    if (resObject.data.files[0]) {
                        objectFolderId = resObject.data.files[0].id
                    } else {
                        var objectFolderMetadata = {
                            'name': object.title,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [itemFolderId]
                        };
                        drive.files.create({
                            resource: objectFolderMetadata,
                            fields: 'id'
                        }, async function (err, objectFolder) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                //console.log("Item")
                                //console.log('Folder Id: ', file.data.id);
                                objectFolderId = objectFolder.data.id
                                var objectFileMetadata = {
                                    'name': (object.title + ".json"),
                                    parents: [objectFolderId]
                                };
                                objectDetails = await Item.findById(object._id)
                                var objectFileMedia = {
                                    mimeType: 'application/json',
                                    body: JSON.stringify(objectDetails)
                                };
                                drive.files.create({
                                    resource: objectFileMetadata,
                                    media: objectFileMedia,
                                    fields: 'id'
                                }, function (err, objectFile) {
                                    if (err) {
                                        // Handle error
                                        console.error(err);
                                    } else {}
                                });
                            }

                        })


                    }

                    objectPageToken = resObject.nextPageToken;
                    objectCallback();
                }
            });
        }, function () {
            return !!objectPageToken;
        }, function (err) {
            if (err) {
                // Handle error
                console.error(err);
            } else {
                // All pages fetched
            }
        })
    })
}

module.exports = router;