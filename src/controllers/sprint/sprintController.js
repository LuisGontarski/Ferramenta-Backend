const { insertSprint } = require("../models/sprintModel");

exports.createSprint = async (req, res) => {
  const { nome, projeto_id } = req.body;

  // Validação básica
  if (!nome || !projeto_id) {
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    const novaSprint = await insertSprint({ nome, projeto_id });
    res.status(201).json(novaSprint);
  } catch (error) {
    console.error("Erro ao criar sprint:", error);
    res.status(500).json({ message: "Erro interno ao criar sprint." });
  }
};
