const pool = require("../db/db");


async function buscarNotificacoesUsuario(usuario_id, limit = 20, offset = 0) {
  if (!usuario_id) {
    throw new Error("usuário_id é obrigatório");
  }

  const query = `
    SELECT 
      notificacao_id,
      usuario_id,
      tarefa_id,
      tipo_notificacao,
      titulo,
      mensagem,
      lida,
      criado_em,
      lida_em
    FROM historico_notificacao
    WHERE usuario_id = $1
    ORDER BY criado_em DESC
    LIMIT $2 OFFSET $3
  `;

  try {
    const result = await pool.query(query, [usuario_id, limit, offset]);
    return result.rows;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    throw error;
  }
}


async function contarNotificacoesNaoLidas(usuario_id) {
  if (!usuario_id) {
    throw new Error("usuário_id é obrigatório");
  }

  const query = `
    SELECT COUNT(*) as total
    FROM historico_notificacao
    WHERE usuario_id = $1 AND lida = false
  `;

  try {
    const result = await pool.query(query, [usuario_id]);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error("Erro ao contar notificações não lidas:", error);
    throw error;
  }
}

async function marcarNotificacaoLida(notificacao_id, usuario_id) {
  if (!notificacao_id || !usuario_id) {
    throw new Error("notificacao_id e usuario_id são obrigatórios");
  }

  const query = `
    UPDATE historico_notificacao 
    SET lida = true, lida_em = NOW()
    WHERE notificacao_id = $1 AND usuario_id = $2
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [notificacao_id, usuario_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    throw error;
  }
}

async function marcarTodasNotificacoesLidas(usuario_id) {
  if (!usuario_id) {
    throw new Error("usuário_id é obrigatório");
  }

  const query = `
    UPDATE historico_notificacao 
    SET lida = true, lida_em = NOW()
    WHERE usuario_id = $1 AND lida = false
  `;

  try {
    await pool.query(query, [usuario_id]);
    return true;
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    throw error;
  }
}

module.exports = {
  buscarNotificacoesUsuario,
  contarNotificacoesNaoLidas,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
};
