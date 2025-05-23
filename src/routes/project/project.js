const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/project/projectController');


router.get('/projects/:id', projectController.getProjectsById);
router.post('/projects', projectController.postCreateProject);
router.put('/projects', projectController.putUpdateProject);
router.delete('/projects/:id', projectController.deleteProject);

module.exports = router;