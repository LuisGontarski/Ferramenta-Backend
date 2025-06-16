const express = require("express");
const router = express.Router();

const commitCountController = require("../../controllers/github/commitCountController");
const githubAuthController = require("../../controllers/github/githubAuthController");

router.get("/github/commit/count", commitCountController.getCommitCount);

router.get("/auth/github/callback", githubAuthController.githubCallback);
router.get("/auth/github/login", githubAuthController.githubLogin);
router.get("/github/repos", githubAuthController.getUserRepositories);

router.post("/github/commit", githubAuthController.postCommitFile);

router.post("/github/create/repo", githubAuthController.postCreateRepo);
router.delete("/github/delete/repo", githubAuthController.deleteRepo);

router.get("/repos/:owner/:repo/status", githubAuthController.getRepoStatus);




module.exports = router;
