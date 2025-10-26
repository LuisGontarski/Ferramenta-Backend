const tarefaModel = require("../../model/tarefaModel");
const { getEmailUsuario } = require("../../model/tarefaModel");
const { enviarEmail } = require("../../email/email");
const { insertTarefa } = require("../../model/tarefaModel");
const { listTarefasBySprint } = require("../../model/tarefaModel");
const { updateFaseTarefa } = require("../../model/tarefaModel");
const projetoModel = require("../../model/tarefaModel");
const usuarioModel = require("../../model/tarefaModel");
const { getUserById } = require("../../model/loginModel");
const { getProjectById } = require("../../model/projectModel");
const { sendEmail } = require("../../email/email");
const { updateStatusRequisitoPorTarefa } = require("../../model/tarefaModel");
const { registrarHistoricoTarefa } = require("../../model/tarefaModel");
const { getTarefaById } = require("../../model/tarefaModel");
const pool = require("../../db/db");

const { atualizarStatusRequisito } = require("../../model/requisitoModel");
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
    requisito_id,
  } = req.body;

  // Validação básica
  if (!titulo || !status || !projeto_id || !criador_id || !sprint_id) {
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    // ✅ 1. Criar tarefa (CÓDIGO ORIGINAL - mantido igual)
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
      requisito_id,
    });

    // ✅ 2. Registrar histórico da tarefa
    try {
      await registrarHistoricoTarefa(
        novaTarefa.tarefa_id,
        "CRIACAO",
        null,
        null,
        null,
        criador_id,
        `Tarefa criada: "${titulo}" - Status: ${status}`
      );
    } catch (histError) {
      console.error("⚠️ Erro no histórico (ignorado):", histError.message);
    }

    if (responsavel_id) {
      try {
        const [responsavel, criador, projeto] = await Promise.all([
          getUserById(responsavel_id),
          getUserById(criador_id),
          getProjectById(projeto_id),
        ]);

        if (responsavel && responsavel.email && projeto && criador) {
          const nomeResponsavel =
            responsavel.nome_usuario || responsavel.nome || "Usuário";
          const nomeCriador = criador.nome_usuario || criador.nome || "Alguém";
          const nomeProjeto = projeto.nome || "um projeto";

          const subject = `Nova Tarefa Atribuída: ${novaTarefa.titulo}`;
          const text =
            `Olá ${nomeResponsavel},\n\n` +
            `Você foi atribuído(a) à tarefa "${novaTarefa.titulo}" no projeto "${nomeProjeto}" por ${nomeCriador}.\n\n` +
            `Detalhes:\n` +
            `- Prioridade: ${novaTarefa.prioridade || "Não definida"}\n` +
            `- Tipo: ${novaTarefa.tipo || "Não definido"}\n` +
            `- Data de Início: ${
              novaTarefa.data_inicio
                ? new Date(novaTarefa.data_inicio).toLocaleDateString()
                : "Não definida"
            }\n\n` +
            `Acesse a plataforma para mais detalhes.\n\n` +
            `Atenciosamente,\nEquipe da Plataforma`;

          // ✅ 3. NOVO: Registrar notificação no banco ANTES de enviar email
          try {
            const notificacaoQuery = `
              INSERT INTO historico_notificacao 
              (usuario_id, tarefa_id, tipo_notificacao, titulo, mensagem)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING notificacao_id;
            `;

            await pool.query(notificacaoQuery, [
              responsavel_id,
              novaTarefa.tarefa_id,
              "TAREFA_ATRIBUÍDA",
              "Nova Tarefa Atribuída",
              `Você foi atribuído à tarefa "${titulo}" no projeto "${nomeProjeto}" por ${nomeCriador}.`,
            ]);

            console.log(
              `✅ Notificação registrada no banco para usuário: ${responsavel_id}`
            );
          } catch (notificacaoError) {
            console.error(
              "❌ Erro ao registrar notificação (ignorado):",
              notificacaoError.message
            );
          }

          // ✅ 4. Enviar email (código original mantido)
          sendEmail(responsavel.email, subject, text)
            .then(() =>
              console.log(
                `E-mail de notificação enviado para ${responsavel.email}`
              )
            )
            .catch((emailError) =>
              console.error(
                `Falha ao enviar e-mail para ${responsavel.email}:`,
                emailError
              )
            );
        } else {
          console.warn(`Não foi possível enviar e-mail: dados incompletos`);
        }
      } catch (emailRelatedError) {
        console.error(
          "Erro ao buscar dados para notificação:",
          emailRelatedError
        );
      }
    }

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
  const { fase_tarefa, data_inicio_real, data_fim_real, usuario_id } = req.body;

  if (!fase_tarefa) {
    return res
      .status(400)
      .json({ message: "O campo fase_tarefa é obrigatório." });
  }

  try {
    // 1. Buscar a tarefa atual para pegar a fase anterior
    const tarefaAtual = await getTarefaById(id);
    if (!tarefaAtual) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    const fase_anterior = tarefaAtual.fase_tarefa;

    // 2. Atualizar a tarefa (código original)
    const updatedTarefa = await updateFaseTarefa(
      id,
      fase_tarefa,
      data_inicio_real,
      data_fim_real
    );

    // 3. ✅ NOVO: Registrar histórico apenas se a fase mudou
    if (fase_anterior !== fase_tarefa) {
      try {
        await registrarHistoricoTarefa(
          id,
          "FASE_ALTERADA",
          "fase_tarefa",
          fase_anterior.toString(),
          fase_tarefa.toString(),
          usuario_id || tarefaAtual.criador_id,
          `Fase alterada: ${fase_anterior} → ${fase_tarefa}`
        );
      } catch (histError) {
        // ❌ ERRO NO HISTÓRICO NÃO AFETA A ATUALIZAÇÃO DA TAREFA
        console.error("⚠️ Erro no histórico (ignorado):", histError.message);
      }
    }

    // 4. Código original do requisito (se tiver)
    let novoStatusRequisito;
    if (fase_tarefa === "Backlog" || fase_tarefa === "Para Fazer") {
      novoStatusRequisito = "Registrado";
    } else if (fase_tarefa === "Executar" || fase_tarefa === "Revisar") {
      novoStatusRequisito = "Em andamento";
    } else if (fase_tarefa === "Feito") {
      novoStatusRequisito = "Finalizado";
    }

    if (updatedTarefa.requisito_id && novoStatusRequisito) {
      await updateStatusRequisitoPorTarefa(id, novoStatusRequisito);
    }

    if (fase_tarefa === "Feito" && fase_anterior !== "Feito") {
      (async () => {
        try {
          const projeto = await getProjectById(updatedTarefa.projeto_id);
          if (!projeto || !projeto.criador_id) {
            throw new Error(
              `Projeto (ID: ${updatedTarefa.projeto_id}) ou criador não encontrado.`
            );
          }
          const donoDoProjeto = await getUserById(projeto.criador_id);
          if (!donoDoProjeto || !donoDoProjeto.email) {
            throw new Error(
              `Email do dono do projeto (ID: ${projeto.criador_id}) não encontrado.`
            );
          }

          let nomeResponsavel = "Alguém";
          if (updatedTarefa.responsavel_id) {
            const responsavelTarefa = await getUserById(
              updatedTarefa.responsavel_id
            );
            nomeResponsavel = responsavelTarefa
              ? responsavelTarefa.nome_usuario ||
                responsavelTarefa.nome ||
                "Usuário"
              : "Alguém";
          }

          const subject = `Tarefa Concluída: ${updatedTarefa.titulo}`;
          const text =
            `Olá ${donoDoProjeto.nome_usuario || donoDoProjeto.nome},\n\n` +
            `A tarefa "${updatedTarefa.titulo}" foi movida para "Feito" no projeto "${projeto.nome}".\n\n` +
            `- Tarefa concluída por: ${nomeResponsavel}\n\n` +
            `Atenciosamente,\nEquipe da Plataforma`;

          await sendEmail(donoDoProjeto.email, subject, text);
          console.log(
            `E-mail de conclusão de tarefa enviado para ${donoDoProjeto.email}`
          );
        } catch (emailError) {
          console.error(`Falha ao enviar e-mail de conclusão:`, emailError);
        }
      })();
    }

    res.status(200).json(updatedTarefa);
  } catch (err) {
    console.error("Erro ao atualizar tarefa:", err);
    res.status(500).json({ message: "Erro interno ao atualizar a tarefa." });
  }
};

exports.updateComentarioTarefa = async (req, res) => {
  const { id } = req.params;
  const { comentario, commit_url } = req.body;

  if (comentario === undefined && commit_url === undefined) {
    return res
      .status(400)
      .json({ message: "Nenhum dado para atualizar foi fornecido." });
  }

  try {
    const updatedTarefa = await tarefaModel.updateComentarioECommit(
      id,
      comentario,
      commit_url
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

  try {
    // 1️⃣ Buscar observação da tarefa
    const tarefa = await tarefaModel.getObservacaoTarefa(tarefa_id);
    if (!tarefa) {
      console.error("Tarefa não encontrada");
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    // 2️⃣ Buscar informações do projeto
    const projeto = await projetoModel.getProjetoById(projeto_id);
    if (!projeto) {
      console.error("Projeto não encontrado");
      return res.status(400).json({ message: "Projeto não encontrado." });
    }

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

// No tarefaController.js - adicione este endpoint
exports.getHistoricoTarefasPorProjeto = async (req, res) => {
  const { projeto_id } = req.params;

  console.log("🔧 DEBUG: getHistoricoTarefasPorProjeto chamado");
  console.log("🔧 DEBUG: projeto_id:", projeto_id);

  if (!projeto_id) {
    return res.status(400).json({ message: "projeto_id é obrigatório." });
  }

  try {
    const historico = await tarefaModel.getHistoricoTarefasPorProjeto(
      projeto_id
    );

    console.log(
      `✅ DEBUG: ${historico.length} registros de histórico encontrados para o projeto`
    );

    res.status(200).json({
      success: true,
      projeto_id,
      total: historico.length,
      historico,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico de tarefas do projeto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar histórico do projeto",
    });
  }
};

exports.getTarefasByProjeto = async (req, res) => {
  const { projeto_id } = req.params;

  console.log("🔧 DEBUG: getTarefasByProjeto chamado");
  console.log("🔧 DEBUG: projeto_id:", projeto_id);

  if (!projeto_id) {
    return res.status(400).json({
      success: false,
      message: "projeto_id é obrigatório.",
    });
  }

  try {
    const tarefas = await tarefaModel.getTarefasByProjeto(projeto_id);

    console.log(
      `✅ DEBUG: ${tarefas.length} tarefas encontradas para o projeto`
    );

    res.status(200).json({
      success: true,
      projeto_id,
      total: tarefas.length,
      tarefas,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar tarefas do projeto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar tarefas do projeto",
    });
  }
};
