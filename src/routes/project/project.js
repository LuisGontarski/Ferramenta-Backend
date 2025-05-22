const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/project/projectController');


router.get('/projects/:id', projectController.getProjectsById);
router.post('/projects', projectController.createProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

module.exports = router;