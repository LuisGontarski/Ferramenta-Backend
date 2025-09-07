const pool = require("../db/db");

// Busca todos os commits de um usuário específico
async function getCommitsByUsuario(usuario_id) {
  const query = `
    SELECT c.commit_id, c.hash_commit, c.mensagem, c.data_commit, p.nome AS projeto_nome
    FROM commit c
    JOIN projeto p ON c.projeto_id = p.projeto_id
    WHERE c.usuario_id = $1
    ORDER BY c.data_commit DESC
  `;
  const values = [usuario_id];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Erro ao obter commits do usuário no modelo:", error);
    throw error;
  }
}

module.exports = { getCommitsByUsuario };
