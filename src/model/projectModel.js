const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getAllProjects() {
  const query = `SELECT * FROM projeto`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Erro ao obter projetos no modelo:", error);
    throw error;
  }
}

async function getProjectsById(id) {
  const query = `SELECT * FROM projeto WHERE projeto_id = $1`;
  const values = [id];
  const result = await pool.query(query, values);
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0];
}

async function createProject({ nome, descricao, data_inicio, data_fim, nome_equipe}) {
  const projeto_id = uuidv4();
  const query = `
    INSERT INTO projeto (projeto_id, nome, descricao, data_inicio, data_fim_prevista, nome_equipe)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING projeto_id;
  `;
  const values = [projeto_id, nome, descricao, data_inicio, data_fim, nome_equipe];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao criar projeto no modelo:", error);
    throw error;
  }
}

async function updateProject({
  projeto_id,
  nome,
  descricao,
  data_inicio,
  data_fim,
}) {
  const query = `
    UPDATE projeto
    SET
      nome = COALESCE($1, nome),
      descricao = COALESCE($2, descricao),
      data_inicio = COALESCE($3, data_inicio),
      data_fim_prevista = COALESCE($4, data_fim_prevista)
    WHERE projeto_id = $5
    RETURNING projeto_id;
  `;
  const values = [nome, descricao, data_inicio, data_fim, projeto_id];
  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return null;
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

module.exports = {
  getAllProjects,
  getProjectsById,
  createProject,
  updateProject,
  deleteProject,
};
