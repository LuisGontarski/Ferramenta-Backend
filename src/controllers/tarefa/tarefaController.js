const tarefaModel = require("../../model/tarefaModel");
const { getEmailUsuario } = require("../../model/tarefaModel");
const { enviarEmail } = require("../../email/email");
const { insertTarefa } = require("../../model/tarefaModel");
const { listTarefasBySprint } = require("../../model/tarefaModel");
const { updateFaseTarefa } = require("../../model/tarefaModel");
const projetoModel = require("../../model/tarefaModel");
const usuarioModel = require("../../model/tarefaModel");
const { getUserById } = require("../../model/loginModel")
const { getProjectById } = require("../../model/projectModel"); 
const { sendEmail } = require("../../email/email"); 
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
      requisito_id, // enviar para o model
    });
    if (responsavel_id) { // Só envia se houver um responsável definido
      try {
        // Busca os dados necessários para o e-mail
        const [responsavel, criador, projeto] = await Promise.all([
          getUserById(responsavel_id),
          getUserById(criador_id),
          getProjectById(projeto_id) 
        ]);

        if (responsavel && responsavel.email && projeto && criador) {
          const nomeResponsavel = responsavel.nome_usuario || responsavel.nome || 'Usuário';
          const nomeCriador = criador.nome_usuario || criador.nome || 'Alguém';
          const nomeProjeto = projeto.nome || 'um projeto';
          
          const subject = `Nova Tarefa Atribuída: ${novaTarefa.titulo}`;
          const text = `Olá ${nomeResponsavel},\n\n` +
                       `Você foi atribuído(a) à tarefa "${novaTarefa.titulo}" no projeto "${nomeProjeto}" por ${nomeCriador}.\n\n` +
                       `Detalhes:\n` +
                       `- Prioridade: ${novaTarefa.prioridade || 'Não definida'}\n` +
                       `- Tipo: ${novaTarefa.tipo || 'Não definido'}\n` +
                       `- Data de Início: ${novaTarefa.data_inicio ? new Date(novaTarefa.data_inicio).toLocaleDateString() : 'Não definida'}\n\n` +
                       `Acesse a plataforma para mais detalhes.\n\n` +
                       `Atenciosamente,\nEquipe da Plataforma`;

          // Envia o e-mail (não bloqueia a resposta da API se falhar)
          sendEmail(responsavel.email, subject, text)
            .then(() => console.log(`E-mail de notificação enviado para ${responsavel.email}`))
            .catch(emailError => console.error(`Falha ao enviar e-mail de notificação para ${responsavel.email}:`, emailError));
        } else {
            console.warn(`Não foi possível enviar e-mail: dados incompletos (Responsável: ${!!responsavel}, Email: ${!!responsavel?.email}, Projeto: ${!!projeto}, Criador: ${!!criador})`);
        }
      } catch (emailRelatedError) {
        // Loga o erro, mas não impede a resposta principal
        console.error("Erro ao buscar dados para notificação por e-mail:", emailRelatedError);
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
  const { fase_tarefa, data_inicio_real, data_fim_real } = req.body;

  if (!fase_tarefa) {
    return res
      .status(400)
      .json({ message: "O campo fase_tarefa é obrigatório." });
  }

  try {
    const updatedTarefa = await updateFaseTarefa(
      id,
      fase_tarefa,
      data_inicio_real,
      data_fim_real
    );
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
