const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();
const passport = require("passport")

const ProjectController = require('../controllers/ProjectController')

router.get("/projects", passport.authenticate("jwt", {
    session: false
}), ProjectController.projectsLastYear)

module.exports = router;