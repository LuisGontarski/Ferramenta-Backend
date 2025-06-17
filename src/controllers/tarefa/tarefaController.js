const tarefaModel = require("../../model/tarefaModel");

exports.createTarefa = async (req, res) => {
  const { titulo, nome, prioridade } = req.body;
  try {
    const tarefa = await tarefaModel.createTarefa(titulo, nome, prioridade);
    res.status(201).json(tarefa);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error.message);
    res.status(500).json({ message: "Erro ao criar tarefa" });
  }
};

exports.getTarefas = async (req, res) => {
  try {
    const tarefas = await tarefaModel.getTarefas();
    res.status(200).json(tarefas);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error.message);
    res.status(500).json({ message: "Erro ao buscar tarefas" });
  }
};

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

exports.updateTarefa = async (req, res) => {
  const { id } = req.params;
  const { titulo, responsavel_id, prioridade } = req.body;
  try {
    const tarefa = await tarefaModel.updateTarefa(id, titulo, responsavel_id, prioridade);
    if (!tarefa) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    res.status(200).json(tarefa);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error.message);
    res.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
};

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