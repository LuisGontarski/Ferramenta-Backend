const pool = require("../../db/db");
const { getAllProjects } = require("../../model/projectModel");
const { createProject } = require("../../model/projectModel");
const { validate: isUuid } = require("uuid");
const { createProjectWithTeams } = require("../../model/projectModel");
const { updateProject } = require("../../model/projectModel");
const { getProjectsByUser } = require("../../model/projectModel");
const { getProjectById } = require("../../model/projectModel");
const { deleteProjectById } = require("../../model/projectModel");
const { fetchProjectUsers } = require("../../model/projectModel");
const { getProjectCycleTime } = require("../../model/projectModel");
const { getProjectReport } = require("../../model/projectModel");
const { getProjectMetrics } = require("../../model/projectModel");
const axios = require("axios");
const {
  getUserById,
  getUserByGithubUsername,
} = require("../../model/loginModel");

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

exports.getProjectCycleTime = async (req, res) => {
  const { projeto_id } = req.params;

  if (!projeto_id) {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }

  try {
    const cycleTime = await getProjectCycleTime(projeto_id); // ✅ agora funciona
    res.status(200).json({ cycleTime });
  } catch (err) {
    console.error("Erro ao obter cycle time:", err);
    res.status(500).json({ message: "Erro ao obter cycle time do projeto." });
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

exports.listCommitsByTarefa = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar projeto_id e github_repo do projeto vinculado à tarefa
    const result = await pool.query(
      `SELECT p.github_repo 
       FROM tarefa t
       JOIN projeto p ON t.projeto_id = p.projeto_id
       WHERE t.tarefa_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Tarefa ou projeto não encontrado" });
    }

    const { github_repo } = result.rows[0];

    if (!github_repo) {
      return res.json([]); // Nenhum repositório vinculado
    }

    // Buscar últimos 30 commits do GitHub
    const commits = await getCommitsByRepo(github_repo);

    console.log(commits);

    res.json(commits);
  } catch (error) {
    console.error("Erro ao listar commits:", error);
    res.status(500).json({ message: "Erro interno" });
  }
};

exports.getProjectCommits = async (req, res) => {
  const { projeto_id } = req.params;

  try {
    const projeto = await getProjectById(projeto_id);
    if (!projeto || !projeto.github_repo) {
      return res
        .status(404)
        .json({ message: "Repositório não encontrado para este projeto." });
    }

    const criador = await getUserById(projeto.criador_id);
    if (!criador || !criador.github_token) {
      return res
        .status(401)
        .json({ message: "Token de autenticação do criador não encontrado." });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${projeto.github_repo}/commits`,
      {
        headers: {
          Authorization: `token ${criador.github_token}`,
          Accept: "application/vnd.github.v3+json", // Adicionado Accept header
        },
      }
    );

    // Mapear commits e buscar usuário da plataforma
    const commitsComUsuarioPlataforma = await Promise.all(
      response.data.map(async (commit) => {
        let usuarioPlataforma = null;
        const githubLogin = commit.author?.login; // Get GitHub login from commit data

        if (githubLogin) {
          // Find user in your DB using the GitHub login
          usuarioPlataforma = await getUserByGithubUsername(githubLogin); //
        }

        return {
          id: commit.sha,
          message: commit.commit.message,
          url: commit.html_url,
          data_commit: commit.commit.author.date,
          // Use platform name if found, otherwise fall back to GitHub name
          nome_autor_plataforma:
            usuarioPlataforma?.nome_usuario ||
            commit.commit.author.name ||
            "Desconhecido",
          avatar_url: commit.author?.avatar_url || null, // Keep GitHub avatar for display
        };
      })
    );

    res.json(commitsComUsuarioPlataforma); // Retorna a lista modificada
  } catch (error) {
    console.error(
      "Erro ao buscar commits do projeto:",
      error.response?.data || error.message
    ); // Log mais detalhado
    res.status(500).json({ message: "Erro interno ao buscar commits." });
  }
};

// GET /projects/:projeto_id/tasks/count?fase=Executar,Revisar
exports.getProjectTaskCount = async (req, res) => {
  const { projeto_id } = req.params;
  const { fase } = req.query;

  if (!projeto_id || projeto_id === "null" || projeto_id === "undefined") {
    return res.status(400).json({ message: "ID do projeto é obrigatório." });
  }

  try {
    let query = "SELECT COUNT(*) AS total FROM tarefa WHERE sprint_id = $1";
    const params = [projeto_id];

    // Se projeto_id for a string "null", busca por NULL
    if (projeto_id === "null") {
      query = "SELECT COUNT(*) AS total FROM tarefa WHERE sprint_id IS NULL";
      params.length = 0; // Remove o parâmetro
    }

    if (fase) {
      const fasesArray = String(fase)
        .split(",")
        .map((f) => f.trim());
      const placeholders = fasesArray
        .map((_, i) => `$${params.length + i + 1}`)
        .join(",");
      query += ` AND fase_tarefa IN (${placeholders})`;
      params.push(...fasesArray);
    }

    const result = await pool.query(query, params);
    const total = parseInt(result.rows[0].total, 10);

    res.status(200).json({ total });
  } catch (err) {
    console.error("Erro ao buscar total de tarefas:", err);
    res.status(500).json({ message: "Erro ao buscar total de tarefas" });
  }
};

exports.getProjectReport = async (req, res) => {
  try {
    const { id } = req.params;
    const projectReport = await getProjectReport(id);
    res.status(200).json(projectReport);
  } catch (error) {
    console.error("Erro ao gerar relatório do projeto:", error);
    res.status(500).json({ message: "Erro ao gerar relatório do projeto." });
  }
};

exports.getProjectMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const projectMetrics = await getProjectMetrics(id);
    res.status(200).json(projectMetrics);
  } catch (error) {
    console.error("Erro ao obter métricas do projeto:", error);
    res.status(500).json({ message: "Erro ao obter métricas do projeto." });
  }
};

// Opcional: Endpoint combinado com relatório e métricas
exports.getProjectFullReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [projectReport, projectMetrics] = await Promise.all([
      getProjectReport(id),
      getProjectMetrics(id),
    ]);

    const fullReport = {
      ...projectReport,
      metricas_detalhadas: projectMetrics,
    };

    res.status(200).json(fullReport);
  } catch (error) {
    console.error("Erro ao gerar relatório completo do projeto:", error);
    res
      .status(500)
      .json({ message: "Erro ao gerar relatório completo do projeto." });
  }
};
