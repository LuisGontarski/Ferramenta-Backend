const db = require("../db/db");

// Quantidade total de commits de um usuário
exports.getCommitById = async (usuario_id) => {
  const result = await db.query(
    "SELECT COUNT(*) AS total FROM commit WHERE usuario_id = $1",
    [usuario_id]
  );
  return parseInt(result.rows[0].total, 10);
};

exports.insertCommit = async ({
  usuario_id,
  projeto_id,
  hash_commit,
  mensagem,
  data_commit,
  url_commit,
}) => {
  const result = await db.query(
    `INSERT INTO commit (commit_id, usuario_id, projeto_id, hash_commit, mensagem, data_commit, url_commit)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
     ON CONFLICT (hash_commit, projeto_id) DO NOTHING
     RETURNING *`,
    [usuario_id, projeto_id, hash_commit, mensagem, data_commit, url_commit]
  );
  return result.rows[0] || null; // null se já existia
};
