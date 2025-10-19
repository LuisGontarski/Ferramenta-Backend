// model/requisitoModel.js
const pool = require("../db/db"); // Assumindo que você tenha um pool do pg configurado em db.js

// Criar requisito
async function criarRequisito({
  projeto_id,
  tipo,
  prioridade,
  descricao,
  criterio_aceite,
}) {
  const query = `
    INSERT INTO public.requisito (projeto_id, tipo, prioridade, descricao, criterio_aceite)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    projeto_id,
    tipo,
    prioridade,
    descricao,
    criterio_aceite || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // retorna o requisito criado
  } catch (error) {
    console.error("Erro no criarRequisito:", error);
    throw error;
  }
}

// Listar requisitos por projeto
async function listarRequisitosPorProjeto(projeto_id) {
  const query = `
    SELECT * FROM public.requisito
    WHERE projeto_id = $1
    ORDER BY criado_em ASC;
  `;

  try {
    const result = await pool.query(query, [projeto_id]);
    return result.rows; // retorna um array de requisitos
  } catch (error) {
    console.error("Erro no listarRequisitosPorProjeto:", error);
    throw error;
  }
}

module.exports = {
  criarRequisito,
  listarRequisitosPorProjeto,
};
