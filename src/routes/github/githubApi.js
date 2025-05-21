const express = require('express'); 
const router = express.Router();
const githubApiController = require('../../controllers/github/githubApiController');

router.post('/github', githubApiController.getGithubData);
module.exports = router;

