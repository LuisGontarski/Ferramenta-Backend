const express = require("express");
const db = require("../../db/db");
const router = express.Router();
const sprintController = require("../../controllers/sprint/sprintController");

router.post("/sprint", sprintController.createSprint);
router.get("/sprint/:projeto_id", sprintController.getSprintsByProject);
router.delete("/sprint/:sprint_id", sprintController.deleteSprint);

// 📈 Rota do burndown
router.get('/sprint/:id/burndown', async (req, res) => {
  const sprintId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM sprint WHERE sprint_id = $1", [sprintId]);
    const sprint = result.rows[0];

    if (!sprint) {
      return res.status(404).json({ message: "Sprint não encontrada" });
    }

    const tarefasResult = await db.query(`
  SELECT data_fim_real, SUM(story_points) AS concluidos
  FROM tarefa
  WHERE sprint_id = $1 AND fase_tarefa = 'Feito'
  GROUP BY data_fim_real
  ORDER BY data_fim_real
`, [sprintId]);

const tarefas = tarefasResult.rows;
const total = sprint.story_points || 0;
const dias = sprint.dias_sprint || 1;
const data = [];
let acumulado = 0;

// Pegamos a data inicial do sprint
const sprintStart = new Date(sprint.criado_em);

for (let i = 0; i < dias; i++) {
  const diaAtual = new Date(sprintStart);
  diaAtual.setDate(sprintStart.getDate() + i);

  // Soma os story points do dia atual
  const encontrado = tarefas.find(t => {
    if (!t.data_fim_real) return false;
    const tarefaData = new Date(t.data_fim_real);
    return (
      tarefaData.getFullYear() === diaAtual.getFullYear() &&
      tarefaData.getMonth() === diaAtual.getMonth() &&
      tarefaData.getDate() === diaAtual.getDate()
    );
  });

  if (encontrado) acumulado += parseInt(encontrado.concluidos, 10);

  const restante = total - acumulado;
  const planejado = total - (total / dias) * i;

  data.push({ dia: `Dia ${i + 1}`, planejado, real: restante });
}


    res.json(data);
  } catch (error) {
    console.error("Erro ao calcular burndown:", error);
    res.status(500).json({ message: "Erro ao calcular burndown." });
  }
});

module.exports = router;
