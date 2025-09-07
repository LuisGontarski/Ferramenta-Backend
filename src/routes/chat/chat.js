const express = require("express");
const router = express.Router();
const chatController = require("../../controllers/chat/chatController");

// Envia mensagem via HTTP
router.post("/chat/mensagem", chatController.enviarMensagem);

// Busca mensagens de um projeto
router.get("/chat/mensagens/:projeto_id", chatController.getMensagens);

module.exports = router;
