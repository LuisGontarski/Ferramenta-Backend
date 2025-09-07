const tarefaModel = require("../../model/tarefaModel");
const { getEmailUsuario } = require("../../model/tarefaModel"); // pega o e-mail do usuário pelo ID
const { enviarEmail } = require("../../email/email");

// Criar Tarefa
exports.createTarefa = async (req, res) => {
  const {
    titulo,
    descricao,
    responsavel_id,
    prioridade,
    tipo,
    data_inicio_prevista,
    data_termino_prevista,
    data_inicio_real,
    data_termino_real,
    projeto_id,
    nome,
  } = req.body;

  if (!titulo) {
    return res.status(400).json({ message: "Título é obrigatório." });
  }

  try {
    const tarefa = await tarefaModel.createTarefa({
      titulo,
      descricao,
      responsavel_id,
      prioridade,
      tipo,
      data_inicio_prevista,
      data_termino_prevista,
      data_inicio_real,
      data_termino_real,
      projeto_id,
      nome,
    });

    // Busca o e-mail do responsável no banco
    const emailResponsavel = await getEmailUsuario(responsavel_id);

    console.log("Email do responsável:", emailResponsavel);

    if (emailResponsavel) {
      await enviarEmail(
        emailResponsavel,
        "Nova tarefa atribuída",
        `Olá, você recebeu uma nova tarefa: ${titulo} (prioridade: ${
          prioridade || "não definida"
        }).`
      );
    }

    res.status(201).json(tarefa);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error.message);
    res.status(500).json({ message: "Erro ao criar tarefa" });
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
