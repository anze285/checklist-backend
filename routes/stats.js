const express = require("express");
const {
    check
} = require("express-validator");
const router = express.Router();
const passport = require("passport")

const StatsController = require('../controllers/StatsController')

router.get("/projects", passport.authenticate("jwt", {
        session: false
    }), StatsController.projectsLastYear),
    router.get("/projects/invited", passport.authenticate("jwt", {
        session: false
    }), StatsController.joinedProjectsLastYear)

module.exports = router;