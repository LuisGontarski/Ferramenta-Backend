const express = require("express");
const db = require("../../db/db");
const router = express.Router();
const projectController = require("../../controllers/project/projectController");

router.get("/projects", projectController.getAllProjects);
router.get("/projects/:id", projectController.getProjectById);
router.post("/projects", projectController.postCreateProject);
router.put("/projects/:projeto_id", projectController.putUpdateProject);
router.delete("/projects/:projeto_id", projectController.deleteProject);
router.get("/projects/user/:usuario_id", projectController.getProjectsByUser);

router.get("/projects/:projeto_id/users", projectController.getProjectUsers);

router.get(
  "/projects/:projeto_id/tasks/count",
  projectController.getProjectTaskCount
);

router.patch("/projects/:projeto_id/sprint-selecionada", async (req, res) => {
  try {
    const { projeto_id } = req.params;
    const { sprint_id } = req.body;

    if (!sprint_id) {
      return res.status(400).json({ error: "sprint_id é obrigatório." });
    }

    await db.query(
      "UPDATE projeto SET sprint_selecionada_id = $1 WHERE projeto_id = $2",
      [sprint_id, projeto_id]
    );

    res
      .status(200)
      .json({ message: "Sprint selecionada atualizada com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar sprint selecionada:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.get(
  "/projects/:projeto_id/cycle-time",
  projectController.getProjectCycleTime
);

router.get("/tarefas/:id/commits", projectController.listCommitsByTarefa);

router.get(
  "/projects/:projeto_id/commits",
  projectController.getProjectCommits
);

router.get("/projects/:projeto_id/sprint-selecionada", async (req, res) => {
  const { projeto_id } = req.params;

  try {
    console.log("🔍 Buscando sprint selecionada para projeto:", projeto_id);

    const query = `
      SELECT sprint_selecionada_id 
      FROM projeto 
      WHERE projeto_id = $1
    `;

    const result = await db.query(query, [projeto_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Projeto não encontrado",
      });
    }

    const sprintSelecionadaId = result.rows[0].sprint_selecionada_id;

    console.log("✅ Sprint selecionada encontrada:", sprintSelecionadaId);

    res.status(200).json({
      success: true,
      projeto_id,
      sprint_selecionada_id: sprintSelecionadaId,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar sprint selecionada:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

module.exports = router;
