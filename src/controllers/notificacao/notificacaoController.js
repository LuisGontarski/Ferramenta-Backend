const notificationModel = require("../../model/notificacaoModel");

exports.getNotificacoes = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { limit = 20, page = 0 } = req.query;

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
    console.error("Erro ao buscar notificações:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao buscar notificações",
    });
  }
};

exports.contarNaoLidas = async (req, res) => {
  try {
    const usuario_id = req.user.id;

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

exports.marcarComoLida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID da notificação é obrigatório",
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

    // Busca o novo total de não lidas para atualizar o frontend
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

exports.marcarTodasComoLidas = async (req, res) => {
  try {
    const usuario_id = req.user.id;

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
