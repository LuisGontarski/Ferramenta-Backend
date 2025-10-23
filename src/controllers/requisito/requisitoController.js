const {
  criarRequisito,
  listarRequisitosPorProjeto,
  atualizarRequisito,
  deletarRequisito,
  atualizarStatusRequisito,
} = require("../../model/requisitoModel");

// Criar requisito
exports.postRequisito = async (req, res) => {
  try {
    const { projeto_id, tipo, prioridade, descricao, criterio_aceite } =
      req.body;

    if (!projeto_id || !tipo || !prioridade || !descricao) {
      return res.status(400).json({ message: "Campos obrigatórios ausentes." });
    }

    const requisito = await criarRequisito({
      projeto_id,
      tipo,
      prioridade,
      descricao,
      criterio_aceite,
    });

    res
      .status(201)
      .json({ message: "Requisito criado com sucesso.", requisito });
  } catch (error) {
    console.error("Erro ao criar requisito:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Listar requisitos por projeto
exports.getRequisitosPorProjeto = async (req, res) => {
  try {
    const { projeto_id } = req.params;
    if (!projeto_id)
      return res.status(400).json({ message: "projeto_id é obrigatório." });

    const requisitos = await listarRequisitosPorProjeto(projeto_id);
    res.status(200).json({ requisitos });
  } catch (error) {
    console.error("Erro ao listar requisitos:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

exports.updateRequisito = async (req, res) => {
  try {
    const { requisito_id } = req.params;
    const atualizacao = req.body;

    const requisitoAtualizado = await atualizarRequisito(
      requisito_id,
      atualizacao
    );

    if (!requisitoAtualizado) {
      return res.status(404).json({ message: "Requisito não encontrado." });
    }

    res.status(200).json({ message: "Requisito atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar requisito:", error);
    res.status(500).json({ message: "Erro ao atualizar requisito." });
  }
};

exports.deleteRequisito = async (req, res) => {
  try {
    const { requisito_id } = req.params;
    const deletado = await deletarRequisito(requisito_id);

    if (!deletado) {
      return res.status(404).json({ message: "Requisito não encontrado." });
    }

    res.status(200).json({ message: "Requisito deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar requisito:", error);
    res.status(500).json({ message: "Erro ao deletar requisito." });
  }
};

exports.listarRequisitos = async (req, res) => {
  const { projeto_id } = req.params;

  if (!projeto_id) {
    return res.status(400).json({ message: "Projeto não informado" });
  }

  try {
    const requisitos = await listarRequisitosPorProjeto(projeto_id);
    res.json(requisitos);
  } catch (error) {
    console.error("Erro ao listar requisitos:", error);
    res.status(500).json({ message: "Erro ao listar requisitos" });
  }
};

exports.atualizarStatusRequisito = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status não informado" });
  }

  try {
    const atualizado = await atualizarStatusRequisito(id, status);

    if (!atualizado) {
      return res.status(404).json({ message: "Requisito não encontrado" });
    }

    res
      .status(200)
      .json({ message: "Status do requisito atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar status do requisito:", error);
    res.status(500).json({ message: "Erro ao atualizar status do requisito" });
  }
};
