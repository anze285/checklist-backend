const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();

const StatusController = require('../controllers/StatusController')

router.get("/", StatusController.all)

router.post("/", StatusController.post)

// router.put("/", StatusController.put)

// router.delete("/",  StatusController.delete)

module.exports = router;