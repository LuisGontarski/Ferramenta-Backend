const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getAllUsers() {
  const query = `SELECT * FROM usuario`;
  const result = await pool.query(query);
  return result.rows;
}

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
  const result = await pool.query("SELECT 1 FROM usuario WHERE email = $1", [
    email,
  ]);
  return result.rowCount > 0;
}


async function createUser({ nome, email, senha, cargo, github, foto_perfil }) {
  const id = uuidv4();
  const criadoEm = new Date();

  const query = `
    INSERT INTO usuario (
      usuario_id, nome_usuario, email, senha, cargo, github, foto_perfil
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING usuario_id;
  `;
  const values = [id, nome, email, senha, cargo, github, foto_perfil];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao criar usuário no modelo:", error);
    throw error; // Re-throw para ser tratado pelo controller
  }
}

async function updateUser({ id, nome, email, senha, cargo, github, foto_perfil }) {
  const query = `
    UPDATE usuario
    SET
      nome_usuario = COALESCE($1, nome_usuario),
      email = COALESCE($2, email),
      senha = COALESCE($3, senha),        -- Deve ser o hash da senha se estiver sendo alterada
      cargo = COALESCE($4, cargo),
      github = COALESCE($5, github),
      foto_perfil = COALESCE($6, foto_perfil)
    WHERE usuario_id = $7
    RETURNING usuario_id;
  `;
  const values = [nome, email, senha, cargo, github, foto_perfil, id];
  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null; // Usuário não encontrado para atualizar
    }
    return result.rows[0]; // Retorna os dados do usuário atualizado (sem a senha)
  } catch (error) {
    console.error("Erro ao atualizar usuário no modelo:", error);
    throw error; // Re-throw para ser tratado pelo controller
  }
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
  getAllUsers,
};
