const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getUserByEmail(email) {
  const query = `SELECT * FROM usuario WHERE email = $1`;
  const values = [email];
  const result = await pool.query(query, values);
  return result.rows[0]; 
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

module.exports = {
  createUser,
  getUserByEmail,
};
