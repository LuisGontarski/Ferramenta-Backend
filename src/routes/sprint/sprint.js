const express = require("express");
const router = express.Router();
const sprintController = require("../../controllers/sprint/sprintController");

router.post("/sprint", sprintController.createSprint);
router.get("/sprint/:projeto_id", sprintController.getSprintsByProject);

module.exports = router;