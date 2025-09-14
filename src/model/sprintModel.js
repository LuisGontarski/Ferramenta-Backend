const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function insertSprint(sprint) {
  const query = `
    INSERT INTO sprint (nome, projeto_id)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const values = [sprint.nome, sprint.projeto_id];

  try {
    const result = await pool.query(query, values); // igual ao userModel
    return result.rows[0];
  } catch (error) {
    console.error("Erro no model ao inserir sprint:", error);
    throw error;
  }
}

async function getSprintsByProject(projeto_id) {
  const query = `
    SELECT * FROM sprint
    WHERE projeto_id = $1
    ORDER BY id ASC;
  `;
  const values = [projeto_id];
  const result = await pool.query(query, values);
  return result.rows;
}

async function getSprintsByProject(projeto_id) {
  const query = `
    SELECT sprint_id AS id, nome AS title, criado_em, atualizado_em
    FROM sprint
    WHERE projeto_id = $1
    ORDER BY criado_em ASC;
  `;
  const values = [projeto_id];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Erro no model ao buscar sprints do projeto:", error);
    throw error;
  }
}

module.exports = {
  insertSprint,
  getSprintsByProject,
};
