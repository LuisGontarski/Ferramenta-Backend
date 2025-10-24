const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function insertSprint(sprint) {
  const query = `
    INSERT INTO sprint (nome, projeto_id, story_points)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [sprint.nome, sprint.projeto_id, sprint.story_points || null];

  try {
    const result = await pool.query(query, values);
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

async function deleteSprintById(sprintId) {
  const result = await pool.query(
    "DELETE FROM sprint WHERE sprint_id = $1 RETURNING *",
    [sprintId]
  );
  return result;
}

module.exports = {
  insertSprint,
  getSprintsByProject,
  deleteSprintById,
};
