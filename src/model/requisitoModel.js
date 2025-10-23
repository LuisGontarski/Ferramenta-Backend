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

// Atualizar requisito
// Atualizar requisito
async function atualizarRequisito(requisito_id, dados) {
  const query = `
    UPDATE public.requisito
    SET tipo = $1,
        prioridade = $2,
        descricao = $3,
        criterio_aceite = $4,
        atualizado_em = NOW()
    WHERE requisito_id = $5;
  `;

  try {
    const result = await pool.query(query, [
      dados.tipo,
      dados.prioridade,
      dados.descricao,
      dados.criterio_aceite || null,
      requisito_id,
    ]);

    return result.rowCount > 0; // true se algum registro foi atualizado
  } catch (error) {
    console.error("Erro ao atualizar requisito:", error);
    throw error;
  }
}

// Deletar requisito
async function deletarRequisito(requisito_id) {
  const query = `
    DELETE FROM public.requisito
    WHERE requisito_id = $1;
  `;

  try {
    const result = await pool.query(query, [requisito_id]);
    return result.rowCount > 0; // true se algum registro foi deletado
  } catch (error) {
    console.error("Erro ao deletar requisito:", error);
    throw error;
  }
}

async function listarRequisitosPorProjeto(projeto_id) {
  const query = `
    SELECT requisito_id, tipo, prioridade, descricao, criterio_aceite, status, criado_em, atualizado_em
    FROM requisito
    WHERE projeto_id = $1
    ORDER BY criado_em ASC
  `;

  try {
    const result = await pool.query(query, [projeto_id]);
    return result.rows;
  } catch (error) {
    console.error("Erro no listarRequisitosPorProjeto:", error);
    throw error;
  }
}

async function atualizarStatusRequisito(requisito_id, novoStatus) {
  const query = `
    UPDATE requisito
    SET status = $1, atualizado_em = NOW()
    WHERE requisito_id = $2
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [novoStatus, requisito_id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("Erro no atualizarStatusRequisito:", error);
    throw error;
  }
}

module.exports = {
  criarRequisito,
  listarRequisitosPorProjeto,
  atualizarRequisito,
  deletarRequisito,
  listarRequisitosPorProjeto,
  atualizarStatusRequisito,
};
