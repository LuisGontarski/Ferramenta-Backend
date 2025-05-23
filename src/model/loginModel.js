const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getUserByEmail(email) {
  const query = `SELECT * FROM usuario WHERE email = $1`;
  const values = [email];
  const result = await pool.query(query, values);
  return result.rows[0];
}


async function getUserById(id) {
  const query = `SELECT * FROM usuario WHERE usuario_id = $1`;
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function emailExists(email) {
  const result = await pool.query('SELECT 1 FROM usuario WHERE email = $1', [email]);
  return result.rowCount > 0;
}



async function createUser({ nome, email, senha }) {
  const id = uuidv4();
  const query = `
    INSERT INTO usuario (usuario_id, nome_usuario, email, senha)
    VALUES ($1, $2, $3, $4)
    RETURNING usuario_id;
  `;
  const values = [id, nome, email, senha];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function updateUser({ id, nome, email, senha }) {
  const query = `
    UPDATE usuario
    SET nome_usuario = $1, email = $2, senha = $3
    WHERE usuario_id = $4
    RETURNING usuario_id;
  `;
  const values = [nome, email, senha, id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Função para deletar um usuário
async function deleteUser(id) {
  const query = `
    DELETE FROM usuario
    WHERE usuario_id = $1
    RETURNING usuario_id;
  `;
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0]; // Retorna o ID do usuário deletado
}

module.exports = {
  getUserByEmail,
  getUserById,
  emailExists,
  createUser,
  updateUser,
  deleteUser,
};
