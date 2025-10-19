const express = require("express");
const router = express.Router();
const requisitoController = require("../../controllers/requisito/requisitoController");

// Criar requisito
router.post("/create", requisitoController.postRequisito);

// Listar requisitos de um projeto
router.get("/list/:projeto_id", requisitoController.getRequisitosPorProjeto);

module.exports = router;
