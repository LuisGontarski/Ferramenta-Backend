const express = require("express");
const router = express.Router();
const commitController = require("../../controllers/commitController");

router.get("/commit/:id", commitController.getCommitById);
router.post("/commit/sync", commitController.syncCommits);

module.exports = router;