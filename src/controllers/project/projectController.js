const { getAllProjects } = require("../../model/projectModel");
const { createProject } = require("../../model/projectModel");
const { getProjectsById } = require("../../model/projectModel");
const { updateProject } = require("../../model/projectModel");
const { deleteProject } = require("../../model/projectModel");

exports.getAllProjects = async (_req, res) => {
  try {
    const projects = await getAllProjects();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Erro ao obter projetos:", error);
    res.status(500).json({ message: "Erro ao obter projetos." });
  }
};

exports.postCreateProject = async (req, res) => {
  const { nome, descricao, data_inicio, data_fim, repositorio } = req.body;

  if (!nome || !descricao || !data_inicio || !data_fim) {
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

  if (typeof data_inicio !== "string" || !Date.parse(data_inicio)) {
    return res.status(400).json({ message: "Data de início inválida." });
  }

  if (typeof data_fim !== "string" || !Date.parse(data_fim)) {
    return res.status(400).json({ message: "Data de fim inválida." });
  }

  try {
    const novoProjeto = await createProject({
      nome,
      descricao,
      data_inicio,
      data_fim,
      repositorio,
    });
    if (!novoProjeto) {
      return res.status(500).json({ message: "Erro ao criar projeto." });
    }
    res.status(201).json({
      message: "Projeto criado com sucesso!",
      projeto_id: novoProjeto.projeto_id,
    });
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
exports.putUpdateProject = async (req, res) => {
  const { projeto_id } = req.params;
  const { nome, descricao, data_inicio, data_fim } = req.body;

  if (!projeto_id) {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }
  if (!nome || !descricao || !data_inicio || !data_fim) {
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
  if (typeof data_inicio !== "string" || !Date.parse(data_inicio)) {
    return res.status(400).json({ message: "Data de início inválida." });
  }
  if (typeof data_fim !== "string" || !Date.parse(data_fim)) {
    return res.status(400).json({ message: "Data de fim inválida." });
  }

  try {
    const projectUpdated = await updateProject({
      projeto_id,
      nome,
      descricao,
      data_inicio,
      data_fim,
    });

    if (!projectUpdated) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    res.status(200).json({ message: "Projeto atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    res.status(500).json({ message: "Erro interno ao atualizar projeto." });
  }
};

// DELETE /projects
exports.deleteProject = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }

  try {
    const projectDeleted = deleteProject(id);

    if (!projectDeleted) {
      return res.status(404).json({ message: "Projeto nao encontrado." });
    }

    res.status(200).json({ message: "Projeto deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    res.status(500).json({ message: "Erro interno ao deletar projeto." });
  }
};
