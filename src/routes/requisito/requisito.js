const express = require("express");
const router = express.Router();
const requisitoController = require("../../controllers/requisito/requisitoController");

// Criar requisito
router.post("/requisito/create", requisitoController.postRequisito);

// Listar requisitos de um projeto
router.get("/requisito/list/:projeto_id", requisitoController.getRequisitosPorProjeto);

// Atualizar requisito
router.put("/requisito/update/:requisito_id", requisitoController.updateRequisito);

// Excluir requisito
router.delete("/requisito/delete/:requisito_id", requisitoController.deleteRequisito);

router.get("/projeto/:projeto_id", requisitoController.listarRequisitos);

router.patch("/:id/status", requisitoController.atualizarStatusRequisito);

module.exports = router;
