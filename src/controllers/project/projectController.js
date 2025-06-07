const { createProject } = require("../../model/projectModel");
const { getProjectsById } = require("../../model/projectModel");
const { putUpdateProject } = require("../../model/projectModel");
const { deleteProject } = require("../../model/projectModel");

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

// POST /projects
exports.postCreateProject = async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || !descricao) {
    return res
      .status(400)
      .json({ message: "Nome e descrição são obrigatórios." });
  }

  if (typeof nome !== "string" || nome.trim() === "") {
    return res.status(400).json({ message: "Nome inválido." });
  }

  if (
    typeof email !== "string" ||
    !email.includes("@") ||
    !email.includes(".com")
  ) {
    return res.status(400).json({ message: "Email inválido." });
  }

  if (typeof senha !== "string" || senha.length < 6) {
    return res
      .status(400)
      .json({ message: "A senha deve ter pelo menos 6 caracteres." });
  }

  try {
    const novoProjeto = await createProject({ nome, descricao });
    res
      .status(201)
      .json({ message: "Projeto criado com sucesso!", id: novoProjeto.id });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({ message: "Erro interno ao criar projeto." });
  }
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
