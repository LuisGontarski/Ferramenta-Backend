// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificacao/notificacaoController');

// Buscar notificações do usuário
router.get('/notificacoes/', notificationController.getNotificacoes);

// Contar notificações não lidas
router.get('/notificacoes/contar-nao-lidas', notificationController.contarNaoLidas);

// Marcar uma notificação como lida
router.patch('/notificacoes/:id/marcar-lida', notificationController.marcarComoLida);

// Marcar todas as notificações como lidas
router.patch('/notificacoes/marcar-todas-lidas', notificationController.marcarTodasComoLidas);

module.exports = router;