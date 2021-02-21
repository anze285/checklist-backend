const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();

const ItemController = require('../controllers/ItemController')

router.get("/", ItemController.all)

router.get("/:id", ItemController.single)

router.post("/", ItemController.post)

router.put("/:id", ItemController.put)

router.delete("/:id",  ItemController.delete)

module.exports = router;