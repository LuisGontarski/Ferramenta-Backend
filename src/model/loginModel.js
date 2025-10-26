const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

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

async function getUserById(usuario_id) {
  const query = `SELECT * FROM usuario WHERE usuario_id = $1`;
  const values = [usuario_id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Atualiza apenas o campo github do usuário
async function updateGithubUsername(usuario_id, github, github_token) {
  const query = `
    UPDATE usuario
    SET github = $2, github_token = $3
    WHERE usuario_id = $1
    RETURNING usuario_id, github_token, github
  `;
  const values = [usuario_id, github, github_token];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Consulta GitHub pelo token
async function getGithubUsernameFromToken(github_token) {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${github_token}` },
    });
    return response.data.login;
  } catch (err) {
    console.error("Erro ao buscar GitHub username:", err);
    return null;
  }
}
async function createUser({
  nome,
  email,
  senha,
  cargo,
  github,
  foto_perfil,
  github_token,
}) {
  const id = uuidv4();

  const query = `
    INSERT INTO usuario (
      usuario_id, nome_usuario, email, senha, cargo, github, foto_perfil, github_token
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING usuario_id;
  `;
  const values = [
    id,
    nome,
    email,
    senha,
    cargo,
    github,
    foto_perfil,
    github_token,
  ];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao criar usuário no modelo:", error);
    throw error;
  }
}

async function getUserByGithubUsername(githubUsername) {
  const query = `SELECT usuario_id, nome_usuario FROM usuario WHERE github = $1`;
  const values = [githubUsername];
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Returns the user object { usuario_id, nome_usuario } or undefined
  } catch (error) {
    console.error("Erro ao buscar usuário pelo GitHub username:", error);
    throw error; // Let the controller handle the error
  }
}

async function updateUser({ id, nome, email }) {
  const query = `
    UPDATE usuario
    SET
      nome_usuario = $1,
      email = $2
    WHERE usuario_id = $3
    RETURNING usuario_id, nome_usuario, email, cargo, github, foto_perfil;
  `;
  const values = [nome, email, id];
  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null; // Usuário não encontrado para atualizar
    }
    return result.rows[0]; // Retorna os dados do usuário atualizado
  } catch (error) {
    console.error("Erro ao atualizar usuário no modelo:", error);
    throw error;
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

async function getUsuariosComGithub(search) {
  let query = `
    SELECT usuario_id, nome_usuario, email, github
    FROM usuario
  `;

  const params = [];

  // Se tiver termo de pesquisa, adiciona o filtro no WHERE
  if (search) {
    query += " WHERE nome_usuario ILIKE $1";
    params.push(`%${search}%`);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = { getUsuariosComGithub };

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  updateGithubUsername,
  getGithubUsernameFromToken,
  getUsuariosComGithub,
  getUserByGithubUsername, // Adiciona a nova função às exportações
  getUsuariosComGithub,
};
