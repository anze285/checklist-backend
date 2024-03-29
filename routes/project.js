const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();
const passport = require("passport")

const ProjectController = require('../controllers/ProjectController')

router.get("/", passport.authenticate("jwt", {
    session: false
}), ProjectController.all)

router.get("/:id", passport.authenticate("jwt", {
    session: false
}), ProjectController.single)

router.post("/", passport.authenticate("jwt", {
    session: false
}), ProjectController.post)

router.put("/:id", passport.authenticate("jwt", {
    session: false
}), ProjectController.put)

router.get("/invite/:inviteLink", passport.authenticate("jwt", {
    session: false
}), ProjectController.inviteLink)

router.get("/admin/all", passport.authenticate("jwt", {
    session: false
}), ProjectController.adminAll)

router.post("/invite", [
    check("emails", "Please enter a valid email").isEmail(),
], passport.authenticate("jwt", {
    session: false
}), ProjectController.multipleInvite)

router.delete("/:id", passport.authenticate("jwt", {
    session: false
}),  ProjectController.delete)

module.exports = router;