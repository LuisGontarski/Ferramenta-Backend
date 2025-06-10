const { createProject } = require("../../model/projectModel");
const { getProjectsById } = require("../../model/projectModel");
const { putUpdateProject } = require("../../model/projectModel");
const { deleteProject } = require("../../model/projectModel");

exports.postCreateProject = async (req, res) => {
  const { nome, descricao, dataInicio, dataFim, repositorio } = req.body;

  if (!nome || !descricao || !dataInicio || !dataFim || !membros || !repositorio) {
    return res
      .status(400)
      .json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
  }

  if (typeof nome !== "string" || nome.trim() === "") {
    return res.status(400).json({ message: "Nome inválido." });
  }

  if (typeof descricao !== "string" || descricao.trim() === "") {
    return res.status(400).json({ message: "Descrição inválida." });
  }

  if (typeof dataInicio !== "string" || !Date.parse(dataInicio)) {
    return res.status(400).json({ message: "Data de início inválida." });
  }

  if (typeof dataFim !== "string" || !Date.parse(dataFim)) {
    return res.status(400).json({ message: "Data de fim inválida." });
  }

  try {
    const novoProjeto = await createProject({ nome, descricao, dataInicio, dataFim, repositorio });
    if (!novoProjeto) {
      return res.status(500).json({ message: "Erro ao criar projeto." });
    }
    res
      .status(201)
      .json({ message: "Projeto criado com sucesso!", id: novoProjeto.id });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({ message: "Erro interno ao criar projeto." });
  }
};

// GET /projects
exports.getProjectsById = (req, res) => {
  const { id } = req.params;
  if (id != fakeProject.id) {
    return res.status(404).json({ message: "ID do projeto não encontrado." });
  }
  res.json({
    id: fakeProject.id,
    nome: fakeProject.nome,
    descricao: fakeProject.descricao,
  });
};

// PUT /projects
exports.putUpdateProject = (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || !descricao) {
    return res
      .status(400)
      .json({ message: "Nome e descrição são obrigatórios." });
  }

  res.status(200).json({ message: "Projeto atualizado com sucesso!" });
};

// DELETE /projects
exports.deleteProject = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }

  res.status(200).json({ message: "Projeto deletado com sucesso!" });
};
