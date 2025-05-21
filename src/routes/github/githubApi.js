const express = require('express'); 
const router = express.Router();
const commitCountController = require('../../controllers/github/commitCountController');

router.get('/commit/count', commitCountController.getCommitCount);
module.exports = router;

