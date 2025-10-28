const notificationModel = require("../../model/notificacaoModel");

exports.contarNaoLidas = async (req, res) => {
  try {
    // Pega o usuario_id do query parameter ou do body
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: "usuario_id é obrigatório",
      });
    }


    const totalNaoLidas = await notificationModel.contarNotificacoesNaoLidas(
      usuario_id
    );

    res.json({
      success: true,
      totalNaoLidas,
    });
  } catch (error) {
    console.error("Erro ao contar notificações não lidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao contar notificações",
    });
  }
};

/**
 * Busca notificações do usuário
 */
exports.getNotificacoes = async (req, res) => {
  try {
    const { usuario_id, page = 0, limit = 20 } = req.query;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: "usuario_id é obrigatório",
      });
    }

    const offset = page * limit;

    const notificacoes = await notificationModel.buscarNotificacoesUsuario(
      usuario_id,
      parseInt(limit),
      parseInt(offset)
    );

    const totalNaoLidas = await notificationModel.contarNotificacoesNaoLidas(
      usuario_id
    );

    res.json({
      success: true,
      notificacoes,
      totalNaoLidas,
      paginacao: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notificacoes.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Backend - Erro ao buscar notificações:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao buscar notificações",
    });
  }
};

/**
 * Marca uma notificação como lida
 */
exports.marcarComoLida = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    if (!id || !usuario_id) {
      return res.status(400).json({
        success: false,
        message: "ID da notificação e usuario_id são obrigatórios",
      });
    }

    const notificacao = await notificationModel.marcarNotificacaoLida(
      id,
      usuario_id
    );

    if (!notificacao) {
      return res.status(404).json({
        success: false,
        message: "Notificação não encontrada",
      });
    }

    const totalNaoLidas = await notificationModel.contarNotificacoesNaoLidas(
      usuario_id
    );

    res.json({
      success: true,
      message: "Notificação marcada como lida",
      totalNaoLidas,
    });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao marcar notificação como lida",
    });
  }
};

/**
 * Marca todas as notificações como lidas
 */
exports.marcarTodasComoLidas = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: "usuario_id é obrigatório",
      });
    }

    await notificationModel.marcarTodasNotificacoesLidas(usuario_id);

    res.json({
      success: true,
      message: "Todas as notificações foram marcadas como lidas",
      totalNaoLidas: 0,
    });
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao marcar notificações como lidas",
    });
  }
};
