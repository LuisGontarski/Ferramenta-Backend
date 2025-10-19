const pool = require("../db/db");

// Criar requisito
async function criarRequisito({
  projeto_id,
  tipo,
  prioridade,
  descricao,
  criterio_aceite,
}) {
  const query = `
    INSERT INTO requisito (projeto_id, tipo, prioridade, descricao, criterio_aceite)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, requisito_id, projeto_id, tipo, prioridade, descricao, criterio_aceite, status, criado_em, atualizado_em;
  `;
  const values = [projeto_id, tipo, prioridade, descricao, criterio_aceite];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Listar requisitos por projeto
async function listarRequisitosPorProjeto(projeto_id) {
  const query = `
    SELECT id, requisito_id, projeto_id, tipo, prioridade, descricao, criterio_aceite, status, criado_em, atualizado_em
    FROM requisito
    WHERE projeto_id = $1
    ORDER BY criado_em DESC;
  `;
  const result = await pool.query(query, [projeto_id]);
  return result.rows;
}

module.exports = {
  criarRequisito,
  listarRequisitosPorProjeto,
};
