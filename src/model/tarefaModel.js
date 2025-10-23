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
  const result = await pool.query(
    `DELETE FROM tarefa WHERE tarefa_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
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
    const fields = [];
    const values = [];
    let idx = 1;

    // sempre atualiza fase_tarefa
    fields.push(`fase_tarefa = $${idx++}`);
    values.push(fase_tarefa);

    if (data_inicio_real) {
      fields.push(`data_inicio_real = $${idx++}`);
      values.push(data_inicio_real);
    }

    if (data_fim_real) {
      fields.push(`data_fim_real = $${idx++}`);
      values.push(data_fim_real);
    }

    // último parâmetro é o ID da tarefa
    values.push(tarefa_id);

    const query = `
      UPDATE tarefa
      SET ${fields.join(", ")}
      WHERE tarefa_id = $${idx}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao atualizar fase da tarefa no model:", err);
    throw err;
  }
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
};
