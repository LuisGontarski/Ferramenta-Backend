const express = require("express");
const router = express.Router();
const requisitoController = require("../../controllers/requisito/requisitoController");

// Criar requisito
router.post("/requisito/create", requisitoController.postRequisito);

// Listar requisitos de um projeto
router.get("/requisito/list/:projeto_id", requisitoController.getRequisitosPorProjeto);
router.get("/requisito/list2/:projeto_id", requisitoController.getRequisitosPorProjeto2);

// Atualizar requisito
router.put("/requisito/update/:requisito_id", requisitoController.updateRequisito);

// Excluir requisito
router.delete("/requisito/delete/:requisito_id", requisitoController.deleteRequisito);

router.get("/projeto/:projeto_id", requisitoController.listarRequisitos);

router.patch("/requisito/:id/status", requisitoController.atualizarStatusRequisito);
router.get("/requisito/:requisito_id/historico", requisitoController.getHistoricoRequisito);

module.exports = router;
