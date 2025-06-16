const express = require("express");
const router = express.Router();
const equipeController = require('../../controllers/equipe/equipeController');

router.post("/equipe", equipeController.criarEquipe);
router.get("/equipe", equipeController.listarEquipes);
router.get("/equipe/:id", equipeController.buscarEquipePorId);
router.put("/equipe/:id", equipeController.atualizarEquipe);
router.delete("/equipe/:id", equipeController.deletarEquipe);

module.exports = router;