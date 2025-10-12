const tarefaModel = require("../../model/tarefaModel");
const { getEmailUsuario } = require("../../model/tarefaModel");
const { enviarEmail } = require("../../email/email");
const { insertTarefa } = require("../../model/tarefaModel");
const { listTarefasBySprint } = require("../../model/tarefaModel");
const { updateFaseTarefa } = require("../../model/tarefaModel");
const projetoModel = require("../../model/tarefaModel"); // ✅ corrigido
const usuarioModel = require("../../model/tarefaModel"); // ✅ adicionado



// Criar Tarefa
exports.createTarefa = async (req, res) => {
  const {
    titulo,
    descricao,
    status,
    prioridade,
    tipo,
    data_inicio,
    data_entrega,
    projeto_id,
    responsavel_id,
    criador_id,
    story_points,
    fase_tarefa,
    sprint_id,
  } = req.body;

  // Validação básica
  if (!titulo || !status || !projeto_id || !criador_id || !sprint_id) {
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    const novaTarefa = await insertTarefa({
      titulo,
      descricao,
      status,
      prioridade,
      tipo,
      data_inicio,
      data_entrega,
      projeto_id,
      responsavel_id,
      criador_id,
      story_points,
      fase_tarefa,
      sprint_id,
    });

    res.status(201).json(novaTarefa);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    res.status(500).json({ message: "Erro interno ao criar tarefa." });
  }
};

// Listar todas as tarefas
exports.getTarefas = async (req, res) => {
  try {
    const tarefas = await tarefaModel.getTarefas();
    res.status(200).json(tarefas);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error.message);
    res.status(500).json({ message: "Erro ao buscar tarefas" });
  }
};

// Obter tarefa por ID
exports.getTarefaById = async (req, res) => {
  const { id } = req.params;
  try {
    const tarefa = await tarefaModel.getTarefaById(id);
    if (!tarefa) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    res.status(200).json(tarefa);
  } catch (error) {
    console.error("Erro ao buscar tarefa:", error.message);
    res.status(500).json({ message: "Erro ao buscar tarefa" });
  }
};

// Atualizar tarefa
exports.updateTarefa = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    const tarefa = await tarefaModel.updateTarefa(id, fields);
    if (!tarefa) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    // Se houver atualização do responsável, enviar e-mail
    if (fields.responsavel_id) {
      const emailResponsavel = await getEmailUsuario(fields.responsavel_id);
      if (emailResponsavel) {
        await enviarEmail(
          emailResponsavel,
          "Tarefa atualizada",
          `A tarefa "${tarefa.titulo}" foi atualizada. Verifique seus detalhes no sistema.`
        );
      }
    }

    res.status(200).json(tarefa);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error.message);
    res.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
};

// Deletar tarefa
exports.deleteTarefa = async (req, res) => {
  const { id } = req.params;
  try {
    const tarefa = await tarefaModel.deleteTarefa(id);
    if (!tarefa) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    res.status(200).json({ message: "Tarefa deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error.message);
    res.status(500).json({ message: "Erro ao deletar tarefa" });
  }
};

exports.getTarefasBySprint = async (req, res) => {
  const { sprint_id } = req.params;

  if (!sprint_id) {
    return res.status(400).json({ message: "ID da sprint é obrigatório." });
  }

  try {
    const tarefas = await listTarefasBySprint(sprint_id);
    res.status(200).json(tarefas);
  } catch (error) {
    console.error("Erro ao obter tarefas da sprint:", error);
    res.status(500).json({ message: "Erro interno ao buscar tarefas." });
  }
};

exports.updatePatchTarefa = async (req, res) => {
  const { id } = req.params;
  const { fase_tarefa } = req.body;

  if (!fase_tarefa) {
    return res
      .status(400)
      .json({ message: "O campo fase_tarefa é obrigatório." });
  }

  try {
    const updatedTarefa = await updateFaseTarefa(id, fase_tarefa); // chama o model
    res.status(200).json(updatedTarefa);
  } catch (err) {
    console.error("Erro ao atualizar tarefa:", err);
    res.status(500).json({ message: "Erro interno ao atualizar a tarefa." });
  }
};

exports.updateComentarioTarefa = async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  if (comentario === undefined) {
    return res
      .status(400)
      .json({ message: "O campo comentario é obrigatório." });
  }

  try {
    const updatedTarefa = await tarefaModel.updateComentarioTarefa(
      id,
      comentario
    );
    res.status(200).json(updatedTarefa);
  } catch (err) {
    console.error("Erro ao atualizar comentário da tarefa:", err);
    res
      .status(500)
      .json({ message: "Erro interno ao atualizar o comentário." });
  }
};

exports.getObservacaoTarefa = async (req, res) => {
  const { id } = req.params;

  try {
    const tarefa = await tarefaModel.getObservacaoTarefa(id);

    if (!tarefa) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    // retorna o campo como "observacao"
    res.status(200).json({ observacao: tarefa.comentario || "" });
  } catch (err) {
    console.error("Erro ao buscar observação da tarefa:", err);
    res.status(500).json({ message: "Erro interno ao buscar observação." });
  }
};

exports.getInformacoesTarefa = async (req, res) => {
  const { tarefa_id, projeto_id } = req.params;

  console.log("=== DEBUG: Início do getInformacoesTarefa ===");
  console.log("tarefa_id:", tarefa_id);
  console.log("projeto_id:", projeto_id);

  try {
    // 1️⃣ Buscar observação da tarefa
    const tarefa = await tarefaModel.getObservacaoTarefa(tarefa_id);
    if (!tarefa) {
      console.error("Tarefa não encontrada");
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }
    console.log("Observação da tarefa encontrada:", tarefa.comentario);

    // 2️⃣ Buscar informações do projeto
    const projeto = await projetoModel.getProjetoById(projeto_id);
    if (!projeto) {
      console.error("Projeto não encontrado");
      return res.status(400).json({ message: "Projeto não encontrado." });
    }
    console.log("Projeto encontrado:", projeto);

    // 3️⃣ Verificar github_repo
    if (!projeto.github_repo) {
      console.error("Projeto sem github_repo configurado");
      return res
        .status(400)
        .json({ message: "Projeto sem github_repo configurado." });
    }

    const [owner, repo] = projeto.github_repo.split("/");
    if (!owner || !repo) {
      console.error("github_repo inválido:", projeto.github_repo);
      return res
        .status(400)
        .json({ message: "github_repo inválido. Use o formato owner/repo." });
    }

    // 4️⃣ Buscar usuário responsável pelo projeto para pegar token
    const usuario = await usuarioModel.getUsuarioById(projeto.criador_id);
    if (!usuario || !usuario.github_token) {
      console.error("Usuário sem github_token válido");
      return res
        .status(400)
        .json({ message: "Usuário sem github_token configurado." });
    }
    console.log("Token GitHub do usuário encontrado");

    // 5️⃣ Buscar commits do GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: {
          Authorization: `token ${usuario.github_token}`,
          "User-Agent": "MeuApp",
        },
      }
    );

    if (!githubResponse.ok) {
      const text = await githubResponse.text();
      console.error("GitHub API error:", githubResponse.status, text);
      return res
        .status(400)
        .json({ message: "Erro ao buscar commits do GitHub" });
    }

    const githubCommits = await githubResponse.json();

    // 6️⃣ Mapear commits
    const commits = githubCommits.map((c) => ({
      id: c.sha,
      message: c.commit.message,
      url: c.html_url,
      data_commit: c.commit.author.date,
    }));

    console.log("Commits encontrados:", commits.length);

    // 7️⃣ Retornar observação + commits
    res.status(200).json({
      observacao: tarefa.comentario || "",
      commits,
    });
  } catch (err) {
    console.error("Erro interno ao buscar informações da tarefa:", err);
    res.status(500).json({ message: "Erro interno ao buscar informações." });
  }
};
