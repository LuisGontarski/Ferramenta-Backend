const db = require("../db/db");
const { v4: uuidv4 } = require("uuid");

exports.criarEquipe = async (nome, descricao) => {
  const equipe_id = uuidv4(); // Gera um UUID único
  const result = await db.query(
    "INSERT INTO equipe (equipe_id, nome, descricao) VALUES ($1, $2, $3) RETURNING *",
    [equipe_id, nome, descricao]
  );
  return result.rows[0];
};

exports.listarEquipes = async () => {
  const result = await db.query("SELECT * FROM equipe");
  return result.rows;
};

exports.buscarEquipePorId = async (id) => {
  const result = await db.query("SELECT * FROM equipe WHERE equipe_id = $1", [id]);
  return result.rows[0];
};

exports.atualizarEquipe = async (id, nome, descricao) => {
  const result = await db.query(
    "UPDATE equipe SET nome = $1, descricao = $2 WHERE equipe_id = $3 RETURNING *",
    [nome, descricao, id]
  );
  return result.rows[0];
};

exports.deletarEquipe = async (id) => {
  await db.query("DELETE FROM equipe WHERE equipe_id = $1", [id]);
};
