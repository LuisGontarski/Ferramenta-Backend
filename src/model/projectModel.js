const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getProjectsById(id) {
  const query = `SELECT * FROM projeto WHERE projeto_id = $1`;
  const values = [id];
  const result = await pool.query(query, values);
  if (result.rowCount === 0) {
    return null; // Retorna null se o projeto não for encontrado
  }
  return result.rows[0];
}

async function createProject({ nome, descricao }) {
  const id = uuidv4();
  const query = `
    INSERT INTO projeto (projeto_id, nome_projeto, descricao)
    VALUES ($1, $2, $3)
    RETURNING projeto_id;
  `;
  const values = [id, nome, descricao];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao criar projeto no modelo:", error);
    throw error;
  }
}

async function updateProject({ id, nome, descricao }) {
  const query = `
    UPDATE projeto
    SET
      nome_projeto = COALESCE($1, nome_projeto),
      descricao = COALESCE($2, descricao)
    WHERE projeto_id = $3
    RETURNING projeto_id;
  `;
  const values = [nome, descricao, id];
  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null; // Projeto não encontrado para atualizar
    }
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao atualizar projeto no modelo:", error);
    throw error;
  }
}

async function deleteProject(id) {
  const query = `DELETE FROM projeto WHERE projeto_id = $1 RETURNING projeto_id;`;
  const values = [id];
  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null; // Projeto não encontrado para deletar
    }
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao deletar projeto no modelo:", error);
    throw error;
  }
}

module.exports = { getProjectsById, createProject, updateProject, deleteProject };