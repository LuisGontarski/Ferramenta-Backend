const { insertSprint } = require("../../model/sprintModel");
const { getSprintsByProject } = require("../../model/sprintModel");
const { deleteSprintById } = require("../../model/sprintModel");

exports.createSprint = async (req, res) => {
  const { nome, projeto_id, story_points } = req.body;

  if (!nome || !projeto_id) {
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    const novaSprint = await insertSprint({ nome, projeto_id, story_points });
    res.status(201).json(novaSprint);
  } catch (error) {
    console.error("Erro ao criar sprint:", error);
    res.status(500).json({ message: "Erro interno ao criar sprint." });
  }
};


exports.getSprintsByProject = async (req, res) => {
  const { projeto_id } = req.params;

  if (!projeto_id) {
    return res.status(400).json({ message: "Projeto não informado." });
  }

  try {
    const sprints = await getSprintsByProject(projeto_id);
    res.status(200).json(sprints);
  } catch (error) {
    console.error("Erro ao buscar sprints do projeto:", error);
    res.status(500).json({ message: "Erro interno ao buscar sprints." });
  }
};

exports.deleteSprint = async (req, res) => {
  const { sprint_id } = req.params;

  if (!sprint_id) return res.status(400).json({ message: "ID da sprint não informado." });

  try {
    const result = await deleteSprintById(sprint_id);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Sprint não encontrada" });
    }

    res.status(200).json({ message: "Sprint deletada com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar sprint:", err);
    res.status(500).json({ message: "Erro interno ao deletar sprint." });
  }
};