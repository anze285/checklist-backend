const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();
const passport = require("passport")

const ItemController = require('../controllers/ItemController')

router.post("/all", ItemController.all)

router.get("/:id", passport.authenticate("jwt", {
    session: false
}), ItemController.single)

router.post("/", passport.authenticate("jwt", {
    session: false
}), ItemController.post)

router.put("/:id", passport.authenticate("jwt", {
    session: false
}), ItemController.put)

router.delete("/:id", passport.authenticate("jwt", {
    session: false
}),  ItemController.delete)

module.exports = router;