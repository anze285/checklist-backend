const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();

const RoleController = require('../controllers/RoleController')

router.get("/", RoleController.all)

router.post("/", RoleController.post)

// router.put("/", StatusController.put)

// router.delete("/",  StatusController.delete)

module.exports = router;