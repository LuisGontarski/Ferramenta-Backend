const express = require("express");
const router = express.Router();
const commitCountController = require("../../controllers/github/commitCountController");
const githubAuthController = require("../../controllers/github/githubAuthController");

router.get("/github/commit/count", commitCountController.getCommitCount);

router.get("/auth/github/callback", githubAuthController.getGithubCallback);
router.get("/auth/github/login", githubController.githubLogin);

module.exports = router;
