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

// GET /projects/:projeto_id/sprint/:sprint_id/metrics
router.get(
  "/projects/:projeto_id/sprint/:sprint_id/metrics",
  async (req, res) => {
    const { projeto_id, sprint_id } = req.params;

    if (!projeto_id || !sprint_id) {
      return res
        .status(400)
        .json({ message: "projeto_id e sprint_id são obrigatórios." });
    }

    try {
      // 1️⃣ Buscar tarefas da sprint
      const query = `
      SELECT 
        tarefa_id,
        titulo,
        story_points,
        tipo,
        data_criacao,
        data_fim_real
      FROM tarefa
      WHERE sprint_id = $1 AND projeto_id = $2
    `;
      const result = await db.query(query, [sprint_id, projeto_id]);
      const tarefas = result.rows;

      if (tarefas.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhuma tarefa encontrada para esta sprint." });
      }

      // 2️⃣ Lead Time médio
      const leadTimes = tarefas
        .filter((t) => t.data_fim_real) // só tarefas finalizadas
        .map(
          (t) =>
            (new Date(t.data_fim_real) - new Date(t.data_criacao)) /
            (1000 * 60 * 60 * 24)
        ); // em dias
      const leadTimeMedio =
        leadTimes.length > 0
          ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
          : 0;

      // 3️⃣ Velocidade da equipe (story points de tarefas finalizadas)
      const velocidade = tarefas
        .filter((t) => t.data_fim_real && t.story_points)
        .reduce((sum, t) => sum + t.story_points, 0);

      // 4️⃣ Taxa de bugs (% de tarefas tipo 'bug')
      const totalTarefas = tarefas.length;
      const totalBugs = tarefas.filter((t) => t.tipo === "bug").length;
      const taxaBugs = totalTarefas > 0 ? (totalBugs / totalTarefas) * 100 : 0;

      res.status(200).json({
        totalTarefas,
        totalBugs,
        taxaBugsPercent: taxaBugs.toFixed(2),
        leadTimeMedioDias: leadTimeMedio.toFixed(2),
        velocidadeStoryPoints: velocidade,
      });
    } catch (err) {
      console.error("Erro ao calcular métricas da sprint:", err);
      res
        .status(500)
        .json({ message: "Erro interno ao calcular métricas da sprint." });
    }
  }
);

router.get("/tarefas/:id/commits", projectController.listCommitsByTarefa);

router.get(
  "/projects/:projeto_id/commits",
  projectController.getProjectCommits
);

router.get("/projects/:projeto_id/sprint-selecionada", async (req, res) => {
  const { projeto_id } = req.params;

  try {
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

// routes/reportRoutes.js
router.get("/projects/:id/full-report", projectController.getProjectFullReport);

module.exports = router;
