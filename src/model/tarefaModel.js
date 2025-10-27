const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getTarefas() {
  const result = await pool.query(`SELECT * FROM tarefa`);
  return result.rows;
}

async function getTarefaById(id) {
  const result = await pool.query(`SELECT * FROM tarefa WHERE tarefa_id = $1`, [
    id,
  ]);
  return result.rows[0];
}

async function updateTarefa(id, fields) {
  const {
    titulo,
    descricao,
    responsavel_id,
    prioridade,
    tipo,
    data_inicio_prevista,
    data_termino_prevista,
    data_inicio_real,
    data_termino_real,
    projeto_id,
    nome,
    status,
  } = fields;

  const result = await pool.query(
    `UPDATE tarefa
     SET titulo = $1, descricao = $2, responsavel_id = $3, prioridade = $4,
         tipo = $5, data_inicio_prevista = $6, data_termino_prevista = $7,
         data_inicio_real = $8, data_termino_real = $9, projeto_id = $10,
         nome = $11, status = $12
     WHERE tarefa_id = $13
     RETURNING *`,
    [
      titulo,
      descricao,
      responsavel_id,
      prioridade,
      tipo,
      data_inicio_prevista,
      data_termino_prevista,
      data_inicio_real,
      data_termino_real,
      projeto_id,
      nome,
      status,
      id,
    ]
  );

  return result.rows[0];
}

async function getEmailUsuario(usuario_id) {
  const result = await pool.query(
    `SELECT email FROM usuario WHERE usuario_id = $1`,
    [usuario_id]
  );
  return result.rows[0]?.email;
}

async function deleteTarefa(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Primeiro exclui os registros dependentes
    await client.query(
      `DELETE FROM historico_notificacao WHERE tarefa_id = $1`,
      [id]
    );

    await client.query(`DELETE FROM historico_tarefa WHERE tarefa_id = $1`, [
      id,
    ]);

    // 2. Depois exclui a tarefa
    const result = await client.query(
      `DELETE FROM tarefa WHERE tarefa_id = $1 RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertTarefa(tarefa) {
  const query = `
    INSERT INTO tarefa (
      titulo, descricao, status, prioridade, tipo, data_inicio, 
      data_entrega, projeto_id, responsavel_id, criador_id, 
      story_points, fase_tarefa, sprint_id, requisito_id, comentario, commit_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *;
  `;

  const values = [
    tarefa.titulo,
    tarefa.descricao || null,
    tarefa.status,
    tarefa.prioridade || null,
    tarefa.tipo || null,
    tarefa.data_inicio || null,
    tarefa.data_entrega || null,
    tarefa.projeto_id,
    tarefa.responsavel_id || null,
    tarefa.criador_id,
    tarefa.story_points || null,
    tarefa.fase_tarefa || null,
    tarefa.sprint_id || null,
    tarefa.requisito_id || null, // novo campo
    tarefa.comentario || null,
    tarefa.commit_url || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro no model ao inserir tarefa:", error);
    throw error;
  }
}

async function listTarefasBySprint(sprint_id) {
  const query = `
    SELECT t.*, u.nome_usuario AS responsavel_nome
    FROM tarefa t
    LEFT JOIN usuario u ON t.responsavel_id = u.usuario_id
    WHERE t.sprint_id = $1
    ORDER BY t.data_inicio ASC; 
  `;
  try {
    const result = await pool.query(query, [sprint_id]);
    return result.rows;
  } catch (error) {
    console.error("Erro no model ao listar tarefas por sprint:", error);
    throw error;
  }
}

async function updateFaseTarefa(
  tarefa_id,
  fase_tarefa,
  data_inicio_real,
  data_fim_real
) {
  try {
    const fields = ["fase_tarefa = $1"];
    const values = [fase_tarefa];
    let queryIndex = 2;

    if (data_inicio_real) {
      fields.push(`data_inicio_real = $${queryIndex++}`);
      values.push(data_inicio_real);
    }
    if (data_fim_real) {
      fields.push(`data_fim_real = $${queryIndex++}`);
      values.push(data_fim_real);
    }
    values.push(tarefa_id); // Adiciona o ID no final

    const query = `
      UPDATE tarefa
      SET ${fields.join(", ")}
      WHERE tarefa_id = $${queryIndex}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao atualizar fase da tarefa no model:", err);
    throw err;
  }
}

async function updateStatusRequisitoPorTarefa(tarefa_id, novoStatus) {
  const query = `
    UPDATE requisito
    SET status = $1, atualizado_em = NOW()
    WHERE requisito_id = (
      SELECT requisito_id FROM tarefa WHERE tarefa_id = $2
    )
    RETURNING *;
  `;

  const result = await pool.query(query, [novoStatus, tarefa_id]);
  return result.rowCount > 0;
}

async function updateComentarioECommit(tarefa_id, comentario, commit_url) {
  try {
    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (comentario !== undefined) {
      fields.push(`comentario = $${queryIndex++}`);
      values.push(comentario);
    }
    if (commit_url !== undefined) {
      fields.push(`commit_url = $${queryIndex++}`);
      values.push(commit_url);
    }
    if (fields.length === 0) {
      const result = await pool.query(
        "SELECT * FROM tarefa WHERE tarefa_id = $1",
        [tarefa_id]
      );
      return result.rows[0];
    }
    values.push(tarefa_id);

    const query = `
      UPDATE tarefa
      SET ${fields.join(", ")} 
      WHERE tarefa_id = $${queryIndex}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao atualizar comentário e commit no model:", err);
    throw err;
  }
}

async function getObservacaoTarefa(tarefa_id) {
  try {
    const query = `
      SELECT comentario, commit_url
      FROM tarefa
      WHERE tarefa_id = $1;
    `;
    const result = await pool.query(query, [tarefa_id]);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao buscar observação no model:", err);
    throw err;
  }
}

async function getProjetoById(projeto_id) {
  try {
    const query = `
      SELECT github_repo, criador_id
      FROM projeto
      WHERE projeto_id = $1;
    `;
    const result = await pool.query(query, [projeto_id]);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao buscar projeto no model:", err);
    throw err;
  }
}

async function getUsuarioById(usuario_id) {
  try {
    const query = `
      SELECT github_token
      FROM usuario
      WHERE usuario_id = $1;
    `;
    const result = await pool.query(query, [usuario_id]);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao buscar usuário no model:", err);
    throw err;
  }
}

async function registrarHistoricoTarefa(
  tarefa_id,
  tipo_alteracao,
  campo_alterado = null,
  valor_anterior = null,
  valor_novo = null,
  usuario_id = null,
  observacao = null
) {
  // ✅ VALIDAÇÃO EXTRA: Garantir que temos um tarefa_id válido
  if (!tarefa_id) {
    console.error("❌ tarefa_id é obrigatório para histórico");
    return null;
  }

  const query = `
    INSERT INTO historico_tarefa 
    (tarefa_id, tipo_alteracao, campo_alterado, valor_anterior, valor_novo, usuario_id, observacao)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  try {
    console.log(`🔧 Tentando registrar histórico para tarefa: ${tarefa_id}`);

    const result = await pool.query(query, [
      tarefa_id,
      tipo_alteracao,
      campo_alterado,
      valor_anterior,
      valor_novo,
      usuario_id,
      observacao,
    ]);

    console.log(
      `✅ Histórico registrado com SUCESSO para tarefa: ${tarefa_id}`
    );
    return result.rows[0];
  } catch (error) {
    // ✅ IMPORTANTE: Só loga o erro, NÃO joga para não quebrar o fluxo principal
    console.error(
      `❌ Erro ao registrar histórico (NÃO CRÍTICO) para tarefa ${tarefa_id}:`,
      error.message
    );
    return null; // Retorna null em vez de throw error
  }
}

// No tarefaModel.js - adicione esta função
async function getHistoricoTarefasPorProjeto(projeto_id) {
  const query = `
    SELECT 
      ht.historico_id,
      ht.tarefa_id,
      ht.tipo_alteracao,
      ht.campo_alterado,
      ht.valor_anterior,
      ht.valor_novo,
      ht.observacao,
      ht.criado_em,
      ht.usuario_id,
      u.nome_usuario as usuario_nome,
      t.titulo as tarefa_titulo,
      t.sprint_id,
      s.nome as sprint_nome,
      -- ✅ CORREÇÃO DO FUSO HORÁRIO:
      TO_CHAR(ht.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_formatada
    FROM historico_tarefa ht
    INNER JOIN tarefa t ON ht.tarefa_id = t.tarefa_id
    LEFT JOIN usuario u ON ht.usuario_id = u.usuario_id
    LEFT JOIN sprint s ON t.sprint_id = s.sprint_id
    WHERE t.projeto_id = $1
    ORDER BY ht.criado_em DESC;
  `;

  try {
    const result = await pool.query(query, [projeto_id]);
    console.log(
      `📊 ${result.rows.length} históricos encontrados para projeto ${projeto_id}`
    );
    return result.rows;
  } catch (error) {
    console.error("Erro ao buscar histórico de tarefas por projeto:", error);
    throw error;
  }
}

// tarefaModel.js

async function getTarefasByProjeto(projeto_id) {
  const query = `
    SELECT 
      t.tarefa_id,
      t.titulo,
      t.descricao,
      t.status,
      t.prioridade,
      t.tipo,
      t.data_inicio,
      t.data_entrega,
      t.story_points,
      t.fase_tarefa,
      t.data_criacao,  -- ✅ CORRIGIDO: era criado_em
      t.projeto_id,
      t.responsavel_id,
      t.criador_id,
      t.requisito_id,
      t.sprint_id,
      s.nome as sprint_nome,
      u_resp.nome_usuario as responsavel_nome,
      u_criador.nome_usuario as criador_nome
    FROM tarefa t
    LEFT JOIN sprint s ON t.sprint_id = s.sprint_id
    LEFT JOIN usuario u_resp ON t.responsavel_id = u_resp.usuario_id
    LEFT JOIN usuario u_criador ON t.criador_id = u_criador.usuario_id
    WHERE t.projeto_id = $1
    ORDER BY t.data_criacao DESC;  -- ✅ CORRIGIDO: era criado_em
  `;

  try {
    const result = await pool.query(query, [projeto_id]);
    console.log(
      `📊 ${result.rows.length} tarefas encontradas para projeto ${projeto_id}`
    );
    return result.rows;
  } catch (error) {
    console.error("Erro ao buscar tarefas por projeto:", error);
    throw error;
  }
}

// No model (tarefaModel.js)
async function getHistoricoTarefaPorId(tarefa_id) {
  const query = `
    SELECT 
      ht.historico_id,
      ht.tarefa_id,
      ht.tipo_alteracao,
      ht.campo_alterado,
      ht.valor_anterior,
      ht.valor_novo,
      ht.observacao,
      ht.criado_em,
      ht.usuario_id,
      u.nome_usuario as usuario_nome,
      t.titulo as tarefa_titulo,
      t.sprint_id,
      s.nome as sprint_nome,
      -- ✅ CORREÇÃO DO FUSO HORÁRIO:
      TO_CHAR(ht.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_formatada
    FROM historico_tarefa ht
    INNER JOIN tarefa t ON ht.tarefa_id = t.tarefa_id
    LEFT JOIN usuario u ON ht.usuario_id = u.usuario_id
    LEFT JOIN sprint s ON t.sprint_id = s.sprint_id
    WHERE ht.tarefa_id = $1
    ORDER BY ht.criado_em DESC;
  `;

  try {
    const result = await pool.query(query, [tarefa_id]);
    console.log(
      `📊 ${result.rows.length} históricos encontrados para tarefa ${tarefa_id}`
    );
    return result.rows;
  } catch (error) {
    console.error("Erro ao buscar histórico da tarefa por ID:", error);
    throw error;
  }
}

// --- EXPORTAÇÃO ÚNICA E CORRIGIDA ---
module.exports = {
  getTarefas,
  getTarefaById,
  updateTarefa,
  getEmailUsuario,
  deleteTarefa,
  insertTarefa,
  listTarefasBySprint,
  updateFaseTarefa,
  updateComentarioECommit,
  getObservacaoTarefa,
  getProjetoById,
  getUsuarioById,
  updateStatusRequisitoPorTarefa,
  registrarHistoricoTarefa,
  getHistoricoTarefasPorProjeto,
  getTarefasByProjeto,
  getHistoricoTarefaPorId,
};
