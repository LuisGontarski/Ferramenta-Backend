const equipeModel = require("../../model/equipeModel");

exports.criarEquipe = async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || !descricao) {
    return res.status(400).json({ message: "Nome e descrição são obrigatórios." });
  }

  try {
    const equipe = await equipeModel.criarEquipe(nome, descricao);
    res.status(201).json(equipe);
  } catch (error) {
    console.error("Erro ao criar equipe:", error.message);
    res.status(500).json({ message: "Erro interno ao criar equipe." });
  }
};

exports.listarEquipes = async (req, res) => {
  try {
    const equipes = await equipeModel.listarEquipes();
    res.json(equipes);
  } catch (error) {
    console.error("Erro ao listar equipes:", error.message);
    res.status(500).json({ message: "Erro ao listar equipes." });
  }
};

exports.buscarEquipePorId = async (req, res) => {
  try {
    const equipe = await equipeModel.buscarEquipePorId(req.params.id);
    if (!equipe) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json(equipe);
  } catch (error) {
    console.error("Erro ao buscar equipe:", error.message);
    res.status(500).json({ message: "Erro ao buscar equipe." });
  }
};

exports.atualizarEquipe = async (req, res) => {
  const { nome, descricao } = req.body;
  const { id } = req.params;

  try {
    const equipe = await equipeModel.atualizarEquipe(id, nome, descricao);
    if (!equipe) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json(equipe);
  } catch (error) {
    console.error("Erro ao atualizar equipe:", error.message);
    res.status(500).json({ message: "Erro ao atualizar equipe." });
  }
};

exports.deletarEquipe = async (req, res) => {
  const { id } = req.params;

  try {
    await equipeModel.deletarEquipe(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar equipe:", error.message);
    res.status(500).json({ message: "Erro ao deletar equipe." });
  }
};
