const tarefaModel = require("../../model/tarefaModel");
const { getEmailUsuario } = require("../../model/tarefaModel"); // pega o e-mail do usuário pelo ID
const { enviarEmail } = require("../../email/email");
const { insertTarefa } = require("../../model/tarefaModel");
const { listTarefasBySprint } = require("../../model/tarefaModel");
const { updateFaseTarefa } = require("../../model/tarefaModel");

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
