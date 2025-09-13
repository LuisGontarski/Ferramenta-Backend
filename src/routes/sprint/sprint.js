const express = require("express");
const router = express.Router();
const sprintController = require("../../controllers/sprint/sprintController");

router.post("/sprint", sprintController.createSprint);

module.exports = router;