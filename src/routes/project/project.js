const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/project/projectController');

router.get('/projects', projectController.getAllProjects);
router.get('/projects/:id', projectController.getProjectsById);
router.post('/projects', projectController.postCreateProject);
router.put('/projects/:projeto_id', projectController.putUpdateProject);
router.delete('/projects/:id', projectController.deleteProject);

module.exports = router;