const { getAllProjects } = require("../../model/projectModel");
const { createProject } = require("../../model/projectModel");
const { validate: isUuid } = require("uuid");
const { createProjectWithTeams } = require("../../model/projectModel");
const { updateProject } = require("../../model/projectModel");
const { getProjectsByUser } = require("../../model/projectModel");
const { getProjectById } = require("../../model/projectModel");
const { deleteProjectById } = require("../../model/projectModel");
const { fetchProjectUsers } = require("../../model/projectModel");

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
  const {
    nome,
    descricao,
    data_inicio,
    data_fim,
    status,
    equipes,
    criador_id,
    github_repo,
  } = req.body;

  // 1️⃣ Valida campos obrigatórios
  if (!criador_id || !isUuid(criador_id)) {
    return res.status(400).json({ message: "Usuário inválido." });
  }

  if (!nome?.trim() || !descricao?.trim() || !data_inicio || !data_fim) {
    return res
      .status(400)
      .json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
  }

  if (typeof nome !== "string" || nome.trim().length === 0) {
    return res.status(400).json({ message: "Nome do projeto inválido." });
  }

  if (typeof descricao !== "string" || descricao.trim().length === 0) {
    return res.status(400).json({ message: "Descrição do projeto inválida." });
  }

  if (!Date.parse(data_inicio)) {
    return res.status(400).json({ message: "Data de início inválida." });
  }

  if (!Date.parse(data_fim)) {
    return res.status(400).json({ message: "Data de fim inválida." });
  }

  if (new Date(data_inicio) > new Date(data_fim)) {
    return res
      .status(400)
      .json({ message: "Data de início não pode ser maior que data de fim." });
  }

  if (criador_id && !isUuid(criador_id)) {
    return res.status(400).json({ message: "ID do criador inválido." });
  }

  // 2️⃣ Valida equipes
  if (!Array.isArray(equipes) || equipes.length === 0) {
    return res
      .status(400)
      .json({ message: "Deve ser enviada pelo menos uma equipe." });
  }

  for (const equipe of equipes) {
    if (!equipe.nome || !equipe.nome.trim()) {
      return res
        .status(400)
        .json({ message: "Cada equipe deve ter um nome válido." });
    }

    if (equipe.usuarios) {
      if (!Array.isArray(equipe.usuarios)) {
        return res
          .status(400)
          .json({ message: "Lista de usuários deve ser um array." });
      }

      for (const usuario_id of equipe.usuarios) {
        if (!isUuid(usuario_id)) {
          return res
            .status(400)
            .json({ message: `ID de usuário inválido: ${usuario_id}` });
        }
      }
    }
  }

  // 3️⃣ Criação do projeto e equipes
  try {
    const novoProjeto = await createProjectWithTeams({
      nome,
      descricao,
      data_inicio,
      data_fim,
      status,
      criador_id,
      equipes,
      github_repo,
    });

    res.status(201).json({
      message: "Projeto criado com sucesso!",
      projeto_id: novoProjeto.projeto_id,
    });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({ message: "Erro interno ao criar projeto." });
  }
};

exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do projeto não informado." });
  }

  try {
    const projeto = await getProjectById(id);

    if (!projeto) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    res.status(200).json(projeto);
  } catch (error) {
    console.error("Erro ao buscar projeto por ID:", error);
    res.status(500).json({ message: "Erro interno ao buscar projeto." });
  }
};

exports.getProjectsByUser = async (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ message: "Usuário não informado." });
  }

  try {
    const projetos = await getProjectsByUser(usuario_id);
    res.status(200).json(projetos);
  } catch (error) {
    console.error("Erro ao buscar projetos do usuário:", error);
    res.status(500).json({ message: "Erro interno ao buscar projetos." });
  }
};

// PUT /projects
exports.putUpdateProject = async (req, res) => {
  const { projeto_id } = req.params; // vem da URL
  const { nome, descricao, data_inicio, data_fim_prevista, status } = req.body; // vem do body

  if (!projeto_id)
    return res.status(400).json({ error: "ID do projeto não informado" });

  try {
    const updated = await updateProject(projeto_id, {
      nome,
      descricao,
      data_inicio,
      data_fim_prevista,
      status,
    });

    if (!updated)
      return res.status(404).json({ error: "Projeto não encontrado" });

    return res.json({
      message: "Projeto atualizado com sucesso",
      projeto: updated,
    });
  } catch (err) {
    console.error("Erro ao atualizar projeto:", err);
    return res.status(500).json({ error: "Erro ao atualizar projeto" });
  }
};

// DELETE /projects
exports.deleteProject = async (req, res) => {
  const { projeto_id } = req.params;

  if (!projeto_id) {
    return res.status(400).json({ error: "ID do projeto é obrigatório" });
  }

  try {
    const deleted = await deleteProjectById(projeto_id);
    if (!deleted) {
      return res.status(404).json({ error: "Projeto não encontrado" });
    }
    return res.json({ message: "Projeto excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar projeto:", err);
    return res.status(500).json({ error: "Erro ao deletar projeto" });
  }
};

// GET /projects/:projetoId/users
exports.getProjectUsers = async (req, res) => {
  const { projeto_id } = req.params;

  if (!projeto_id) {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }

  try {
    const users = await fetchProjectUsers(projeto_id);
    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao obter usuários do projeto:", error);
    res
      .status(500)
      .json({ message: "Erro interno ao buscar usuários do projeto." });
  }
};
