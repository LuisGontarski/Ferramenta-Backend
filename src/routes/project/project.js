const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/project/projectController');

router.get('/projects', projectController.getAllProjects);
router.get("/projects/:id", projectController.getProjectById);
router.post('/projects', projectController.postCreateProject);
router.put('/projects/:projeto_id', projectController.putUpdateProject);
router.delete('/projects/:projeto_id', projectController.deleteProject);
router.get("/projects/user/:usuario_id", projectController.getProjectsByUser);

router.get("/projects/:projeto_id/users", projectController.getProjectUsers);

router.get("/tarefas/:id/commits", projectController.listCommitsByTarefa);

router.get("/projects/:projeto_id/commits", projectController.getProjectCommits);


module.exports = router;