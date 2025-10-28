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
    SELECT *
    FROM public.requisito
    WHERE projeto_id = $1
      AND status = 'Em análise'
    ORDER BY criado_em ASC;
  `;

  try {
    const result = await pool.query(query, [projeto_id]);
    console.log(
      `✅ Encontrados ${result.rows.length} requisitos com status "Em análise"`
    );
    console.log(
      "✅ Requisitos encontrados:",
      result.rows.map((r) => ({ id: r.requisito_id, status: r.status }))
    );
    return result.rows;
  } catch (error) {
    console.error("❌ Erro no listarRequisitosPorProjeto:", error);
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

async function atualizarStatusRequisito(
  requisito_id,
  novoStatus,
  usuario_id = null
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Buscar status atual
    const statusAtualQuery = `
      SELECT status FROM requisito WHERE requisito_id = $1
    `;
    const statusResult = await client.query(statusAtualQuery, [requisito_id]);

    if (statusResult.rows.length === 0) {
      throw new Error("Requisito não encontrado");
    }

    const status_anterior = statusResult.rows[0].status;

    // 2. Atualizar status do requisito
    const updateQuery = `
      UPDATE requisito
      SET status = $1,
          atualizado_em = NOW()
      WHERE requisito_id = $2
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [
      novoStatus,
      requisito_id,
    ]);

    // 3. ✅✅✅ SEMPRE registrar no histórico (mesmo se status for igual)
    const observacao = `Status alterado via atualização de tarefa - Fase: ${novoStatus}`;
    await registrarHistoricoRequisito(
      requisito_id,
      status_anterior,
      novoStatus,
      usuario_id,
      observacao
    );

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ DEBUG: Erro na transaction:", error);
    throw error;
  } finally {
    client.release();
  }
}

// No seu arquivo de models
async function listarRequisitosPorProjeto2(projeto_id) {
  const query = `
    SELECT 
      requisito_id,
      tipo,
      prioridade,
      descricao,
      criterio_aceite,
      status,
      criado_em,
      atualizado_em
    FROM public.requisito
    WHERE projeto_id = $1
      AND status = 'Em análise'
    ORDER BY criado_em ASC;
  `;

  try {
    const result = await pool.query(query, [projeto_id]);

    if (result.rows.length > 0) {
      result.rows.forEach((req, index) => {
        console.log(
          `  ${index + 1}. ID: ${req.requisito_id}, Status: "${
            req.status
          }", Descrição: ${req.descricao.substring(0, 30)}...`
        );
      });
    } else {
    }

    return result.rows;
  } catch (error) {
    console.error("❌ Erro no listarRequisitosPorProjeto2:", error);
    throw error;
  }
}

async function registrarHistoricoRequisito(
  requisito_id,
  status_anterior,
  status_novo,
  usuario_id = null,
  observacao = null
) {
  const query = `
    INSERT INTO historico_requisito 
    (requisito_id, status_anterior, status_novo, usuario_id, observacao)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      requisito_id,
      status_anterior,
      status_novo,
      usuario_id,
      observacao,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("❌ DEBUG: Erro ao inserir histórico:", error);
    throw error;
  }
}

// Model
async function buscarHistoricoRequisito(requisito_id) {
  const query = `
    SELECT 
      hr.historico_id,
      hr.status_anterior,
      hr.status_novo,
      hr.observacao,
      hr.criado_em,
      hr.usuario_id,
      u.nome_usuario as usuario_nome,
      TO_CHAR(hr.criado_em, 'DD/MM/YYYY HH24:MI') as data_formatada
    FROM historico_requisito hr
    LEFT JOIN usuario u ON hr.usuario_id = u.usuario_id
    WHERE hr.requisito_id = $1
    ORDER BY hr.criado_em DESC;
  `;

  try {
    const result = await pool.query(query, [requisito_id]);
    return result.rows;
  } catch (error) {
    console.error("Erro no buscarHistoricoRequisito:", error);
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
  listarRequisitosPorProjeto2,
  registrarHistoricoRequisito,
  buscarHistoricoRequisito,
};
