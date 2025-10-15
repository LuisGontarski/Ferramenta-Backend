const pool = require("../db/db");

async function enviarMensagem(data) {
  const { usuario_id, projeto_id, texto } = data;
  if (!texto || !projeto_id || !usuario_id) {
    throw new Error(
      "Dados inválidos: usuario_id, projeto_id e texto são obrigatórios"
    );
  }

  const query = `
    INSERT INTO mensagem (usuario_id, projeto_id, conteudo)
    VALUES ($1, $2, $3)
    RETURNING mensagem_id, usuario_id, projeto_id, conteudo, criado_em;
  `;
  const values = [usuario_id, projeto_id, texto];

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // criado_em já é timestamptz
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
}

async function getMensagens(projeto_id) {
  const query = `
    SELECT m.mensagem_id, m.usuario_id, m.projeto_id, m.conteudo, u.nome_usuario AS usuario_nome, m.criado_em
    FROM mensagem m
    JOIN usuario u ON m.usuario_id = u.usuario_id
    WHERE m.projeto_id = $1
    ORDER BY m.criado_em ASC;
  `;
  try {
    const result = await pool.query(query, [projeto_id]);
    return result.rows.map((m) => ({
      usuario_id: m.usuario_id,
      usuario_nome: m.usuario_nome,
      texto: m.conteudo,
      data_envio: m.criado_em, // já vem timestamp com fuso
    }));
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    throw error;
  }
}

module.exports = { enviarMensagem, getMensagens };
