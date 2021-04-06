const express = require("express")
const router = express.Router()

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const url = require("url");


function createFolder (auth){
    var fileMetadata = {
        'name': 'Invoices',
        'mimeType': 'application/vnd.google-apps.folder'
    };
    drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('Folder Id: ', file.id);
        }
    });
}
