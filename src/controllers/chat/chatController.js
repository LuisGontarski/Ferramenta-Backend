const chatModel = require("../../model/chatModel");

exports.enviarMensagem = async (req, res) => {
  try {
    const mensagem = await chatModel.enviarMensagem(req.body);
    res.status(201).json(mensagem);
  } catch (err) {
    console.error("Erro ao enviar mensagem via controller:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMensagens = async (req, res) => {
  const { projeto_id } = req.params;
  try {
    const mensagens = await chatModel.getMensagens(projeto_id);
    res.json(mensagens);
  } catch (err) {
    console.error("Erro ao buscar mensagens via controller:", err);
    res.status(500).json({ error: err.message });
  }
};
