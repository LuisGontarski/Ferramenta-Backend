const {
  criarRequisito,
  listarRequisitosPorProjeto,
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
