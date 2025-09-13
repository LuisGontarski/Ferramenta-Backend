const db = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function insertSprint(sprint) {
  const query = `
    INSERT INTO sprint (nome, projeto_id)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const values = [sprint.nome, sprint.projeto_id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro no model ao inserir sprint:", error);
    throw error;
  }
}

exports = {
  insertSprint,
};
