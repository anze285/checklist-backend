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

let Projects = [];
let Items = [];
let Objects = [];
let ids = [];

// If modifying these scopes, delete token.json.
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

router.get("/", async (req, res) => {
    Projects = [];
    Items = [];
    Objects = [];
    ids = [];
    // Load client secrets from a local file.
    const items = await Item.find({
        owner: "60753a34c79eb20004b1e6f7",
        project: true
    });
    //Items += items;
    Projects.push({
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
            Objects.push({
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
        //synchronizeOld(oAuth2Client, JSON.parse(token));
        synchronize(oAuth2Client, JSON.parse(token), "60753a34c79eb20004b1e6f7");
        //res.redirect(oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, }));
        res.sendStatus(200)
    });
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
        var pageToken = null;
        // Using the NPM module 'async'
        async.doWhilst(function (callback) {
            drive.files.list({
                q: "mimeType = 'application/vnd.google-apps.folder'",
                q: ("name='" + project.title + "'"),
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive',
                pageToken: pageToken
            }, function (err, resProject) {
                if (err) {
                    // Handle error
                    console.error(err);
                    callback(err)
                } else {
                    let projectFolderId;
                    if (resProject.data.files[1]) {
                        console.log("ERROR: There are 2 folders with the same name")
                    } else if (resProject.data.files[0]) {
                        projectFolderId = resProject.data.files[0]
                    } else {
                        var projectFolderMetadata = {
                            'name': project.title,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [token.folder_id]
                        };
                        drive.files.create({
                            resource: projectFolderMetadata,
                            fields: 'id'
                        }, function (err, projectFolder) {
                            if (err) {
                                // Handle error
                                console.error(err);
                            } else {
                                //console.log("Project")
                                //console.log('Folder Id: ', file.data.id);
                                projectFolderId = projectFolder.data.id
                                var projectFileMetadata = {
                                    'name': (project.title + ".json"),
                                    parents: [projectFolderId]
                                };
                                var projectFileMedia = {
                                    mimeType: 'application/json',
                                    body: JSON.stringify(project)
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
                    pageToken = resProject.nextPageToken;
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
    })
}


function synchronizeOld(auth, token) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    for (let x = 0; x < Projects[0].items.length; x++) {
        var pageToken = null;
        // Using the NPM module 'async'
        async.doWhilst(function (callback) {
            drive.files.list({
                q: "mimeType = 'application/vnd.google-apps.folder'",
                q: ("name='" + Projects[0].items[x].title + "'"),
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive',
                pageToken: pageToken
            }, function (err, res) {
                if (err) {
                    // Handle error
                    console.error(err);
                    callback(err)
                } else {
                    if (res.data.files[1]) {
                        console.log("ERROR: There are 2 folders with the same name")
                    } else if (res.data.files[0]) {
                        res.data.files.forEach(function (originalFolder) {
                            //console.log('Found file: ', originalFolder.name, originalFolder.id);
                            ids.push({
                                item_id: Projects[0].items[x]._id,
                                folder_id: originalFolder.id
                            })
                        });
                    } else {
                        var fileMetadata = {
                            'name': Projects[0].items[x].title,
                            'mimeType': 'application/vnd.google-apps.folder',
                            parents: [token.folder_id]
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
                                //console.log("Project")
                                //console.log('Folder Id: ', file.data.id);
                                ids.push({
                                    item_id: Projects[0].items[x]._id,
                                    folder_id: file.data.id
                                })
                                var fileMetadata1 = {
                                    'name': (Projects[0].items[x].title + ".json"),
                                    parents: [file.data.id]
                                };
                                var media1 = {
                                    mimeType: 'application/json',
                                    body: JSON.stringify(Projects[0].items[x])
                                };
                                drive.files.create({
                                    resource: fileMetadata1,
                                    media: media1,
                                    fields: 'id'
                                }, function (err, file1) {
                                    if (err) {
                                        // Handle error
                                        console.error(err);
                                    } else {}
                                });
                            }
                        })
                    }
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
        if ((x + 1) == Projects[0].items.length) {
            setTimeout(() => synchronizeItems(auth, token), 3000)
            //synchronizeItems(auth, token)
        }
    }
}

function synchronizeItems(auth, token) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    let itemId = null;
    for (let x = 0; x < Items.length; x++) {
        for (let y = 0; y < Items[x].items.length; y++) {
            /* NEW*/

            var pageToken = null;
            // Using the NPM module 'async'
            async.doWhilst(function (callback) {
                drive.files.list({
                    q: "mimeType = 'application/vnd.google-apps.folder'",
                    q: ("name='" + Items[x].items[y].title + "'"),
                    fields: 'nextPageToken, files(id, name)',
                    spaces: 'drive',
                    pageToken: pageToken
                }, function (err, res) {
                    if (err) {
                        // Handle error
                        console.error(err);
                        callback(err)
                    } else {
                        if (res.data.files[1]) {
                            console.log("ERROR: There are 2 folders with the same name")
                        } else if (res.data.files[0]) {
                            res.data.files.forEach(function (originalItem) {
                                //console.log('Found file: ', originalItem.name, originalItem.id);
                                ids.push({
                                    item_id: Items[x].items[y]._id,
                                    folder_id: originalItem.id
                                })
                            });
                        } else {
                            if (Items[x].items[y].parentItem) {
                                if (ids.length > 0) {
                                    for (let z = 0; z < ids.length; z++) {
                                        itemId = token.folder_id
                                        if (ids[z].item_id.toString() == Items[x].items[y].parentItem.toString()) {
                                            itemId = ids[z].folder_id
                                            break
                                        }
                                    }
                                }
                            } else {
                                itemId = token.folder_id
                            }

                            var fileMetadata = {
                                'name': Items[x].items[y].title,
                                'mimeType': 'application/vnd.google-apps.folder',
                                parents: [itemId]
                            };
                            drive.files.create({
                                resource: fileMetadata,
                                fields: 'id'
                            }, function (err, file) {
                                if (err) {
                                    // Handle error
                                    console.error(err);
                                } else {
                                    //console.log("Item")
                                    //console.log('Folder Id: ', file.data.id);
                                    ids.push({
                                        item_id: Items[x].items[y]._id,
                                        folder_id: file.data.id
                                    })
                                    var fileMetadata1 = {
                                        'name': (Items[x].items[y].title + ".json"),
                                        parents: [file.data.id]
                                    };
                                    var media1 = {
                                        mimeType: 'application/json',
                                        body: JSON.stringify(Items[x].items[y])
                                    };
                                    drive.files.create({
                                        resource: fileMetadata1,
                                        media: media1,
                                        fields: 'id'
                                    }, function (err, file1) {
                                        if (err) {
                                            // Handle error
                                            console.error(err);
                                        } else {}
                                    });
                                }

                            })


                        }
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
            if ((x + 1) == Items.length && (y + 1) == Items[x].items.length) {
                setTimeout(() => synchronizeObjects(auth, token), 10000)
            }
        }
    }
}

function synchronizeObjects(auth, token) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    let itemId = null;
    for (let x = 0; x < Objects.length; x++) {
        for (let y = 0; y < Objects[x].items.length; y++) {

            /* NEW*/

            var pageToken = null;
            // Using the NPM module 'async'
            async.doWhilst(function (callback) {
                drive.files.list({
                    q: "mimeType = 'application/vnd.google-apps.folder'",
                    q: ("name='" + Objects[x].items[y].title + "'"),
                    fields: 'nextPageToken, files(id, name)',
                    spaces: 'drive',
                    pageToken: pageToken
                }, function (err, res) {
                    if (err) {
                        // Handle error
                        console.error(err);
                        callback(err)
                    } else {
                        if (res.data.files[1]) {
                            console.log("ERROR: There are 2 folders with the same name")
                        } else if (res.data.files[0]) {
                            /*res.data.files.forEach(function (originalObject) {
                                console.log(originalObject)
                                console.log('Found file: ', originalObject.name, originalObject.id);
                                ids.push({
                                    item_id: Objects[x].items[y]._id,
                                    folder_id: originalObject.id
                                })
                            });*/
                        } else {
                            if (Objects[x].items[y].parentItem) {
                                if (ids.length > 0) {
                                    for (let z = 0; z < ids.length; z++) {
                                        itemId = token.folder_id
                                        if (ids[z].item_id.toString() == Objects[x].items[y].parentItem.toString()) {
                                            itemId = ids[z].folder_id
                                            break
                                        }
                                    }
                                }
                            } else {
                                itemId = token.folder_id
                            }

                            var fileMetadata = {
                                'name': Objects[x].items[y].title,
                                'mimeType': 'application/vnd.google-apps.folder',
                                parents: [itemId]
                            };
                            drive.files.create({
                                resource: fileMetadata,
                                fields: 'id'
                            }, function (err, file) {
                                if (err) {
                                    // Handle error
                                    console.error(err);
                                } else {
                                    //console.log("Object")
                                    //console.log('Folder Id: ', file.data.id);
                                    ids.push({
                                        item_id: Objects[x].items[y]._id,
                                        folder_id: file.data.id
                                    })
                                    var fileMetadata1 = {
                                        'name': (Objects[x].items[y].title + ".json"),
                                        parents: [file.data.id]
                                    };
                                    var media1 = {
                                        mimeType: 'application/json',
                                        body: JSON.stringify(Objects[x].items[y])
                                    };
                                    drive.files.create({
                                        resource: fileMetadata1,
                                        media: media1,
                                        fields: 'id'
                                    }, function (err, file1) {
                                        if (err) {
                                            // Handle error
                                            console.error(err);
                                        } else {}
                                    });
                                }
                                //consolelog()
                            })
                        }
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
    }
}

module.exports = router;