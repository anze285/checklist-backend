const express = require("express");
const router = express.Router();
const passport = require("passport")
const cors = require('cors');

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
const TokenJWT = require('./models/TokenJWT')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

router.use(cors())

router.post("/", passport.authenticate("jwt", {
  session: false
}), function (req, res) {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return res.send('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), listFiles, req.body.code, res, req);
  });
})

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, callback, code, res, req) {
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
    if (jwtToken) {
      oAuth2Client.setCredentials(jwtToken);
      findChecky(oAuth2Client, jwtToken, res);
    } else {
      getAccessToken(oAuth2Client, callback, code, res, req);
    }
  }


function getAccessToken(oAuth2Client, callback, code, res, req) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  if (code != undefined && code != null) {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      token.user = req.user.id;
      //Creating Google Drive Folder

      createFolder(oAuth2Client, token)

      // res.sendStatus(200);
    });
  } else {
    //res.redirect(authUrl);
    if (authUrl) {
      res.json({
        url: authUrl
      })
    } else {
      res.send({
        msg: "Error creating url"
      })
    }
  }
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({
    version: 'v3',
    auth
  });
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}

function findChecky(auth, token, res1) {
  const drive = google.drive({
    version: 'v3',
    auth
  });
  var pageToken = null;
  // Using the NPM module 'async'
  async.doWhilst(function (callback) {
    drive.files.list({
      //q: "application/vnd.google-apps.folder",
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
          if (file.id == token.folder_id && file.name == "Checky") {
            console.log('Found file checky')
            res1.json({
              "message": "Ste že povezani."
            })
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

var folderId = "";

function createFolder(auth, token) {
  const drive = google.drive({
    version: 'v3',
    auth
  });
  var fileMetadata = {
    'name': 'Checky',
    'mimeType': 'application/vnd.google-apps.folder'
  };
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }, async function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('Folder Id: ', file.data.id);
      token.folder_id = file.data.id;
      //let parentToken;
      //parentToken.push(JSON.stringify(token))
      //fs.writeFile(TOKEN_PATH, parentToken, (err) => {
      const newToken = new TokenJWT(token)
      console.log(newToken)

      await newToken.save()
      console.log("kle pa nisem")

      // fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      //   if (err) return console.error(err);
      //   console.log('Token stored to', TOKEN_PATH);
      // });
    }
  });

  // Store the token to disk for later program executions
}

module.exports = router;