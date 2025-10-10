const express = require("express");
const router = express.Router();
const tarefaController = require("../../controllers/tarefa/tarefaController");

router.post("/tarefas", tarefaController.createTarefa);
router.get("/tarefas", tarefaController.getTarefas);
router.get("/tarefas/:id", tarefaController.getTarefaById);
router.put("/tarefas/:id", tarefaController.updateTarefa);
router.delete("/tarefas/:id", tarefaController.deleteTarefa);

router.get("/tarefas/sprint/:sprint_id", tarefaController.getTarefasBySprint);
router.patch("/tarefas/:id", tarefaController.updatePatchTarefa);
router.patch("/tarefas/:id/comentario", tarefaController.updateComentarioTarefa);
router.get("/tarefas/:tarefa_id/:projeto_id/observacao", tarefaController.getInformacoesTarefa);


module.exports = router;
