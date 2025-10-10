const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

// Criar Tarefa

// Listar todas as tarefas
exports.getTarefas = async () => {
  const result = await db.query(`SELECT * FROM tarefa`);
  return result.rows;
};

// Obter tarefa por ID
exports.getTarefaById = async (id) => {
  const result = await db.query(`SELECT * FROM tarefa WHERE tarefa_id = $1`, [
    id,
  ]);
  return result.rows[0];
};

// Atualizar tarefa
exports.updateTarefa = async (id, fields) => {
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

  const result = await db.query(
    `UPDATE tarefa
     SET titulo = $1,
         descricao = $2,
         responsavel_id = $3,
         prioridade = $4,
         tipo = $5,
         data_inicio_prevista = $6,
         data_termino_prevista = $7,
         data_inicio_real = $8,
         data_termino_real = $9,
         projeto_id = $10,
         nome = $11,
         status = $12,
         data_criacao = COALESCE(data_criacao, NOW())
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
};

exports.getEmailUsuario = async (usuario_id) => {
  const result = await db.query(
    `SELECT email FROM usuario WHERE usuario_id = $1`,
    [usuario_id]
  );
  return result.rows[0]?.email; // retorna o email ou undefined se não achar
};

// Deletar tarefa
exports.deleteTarefa = async (id) => {
  const result = await db.query(
    `DELETE FROM tarefa WHERE tarefa_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

async function insertTarefa(tarefa) {
  const query = `
    INSERT INTO tarefa (
      titulo,
      descricao,
      status,
      prioridade,
      tipo,
      data_inicio,
      data_entrega,
      projeto_id,
      responsavel_id,
      criador_id,
      story_points,
      fase_tarefa,
      sprint_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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

async function updateFaseTarefa(tarefa_id, fase_tarefa) {
  try {
    const query = `
      UPDATE tarefa
      SET fase_tarefa = $1
      WHERE tarefa_id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [fase_tarefa, tarefa_id]);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao atualizar fase da tarefa no model:", err);
    throw err;
  }
}

async function updateComentarioTarefa(tarefa_id, comentario) {
  try {
    const query = `
      UPDATE tarefa
      SET comentario = $1
      WHERE tarefa_id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [comentario, tarefa_id]);
    return result.rows[0];
  } catch (err) {
    console.error("Erro ao atualizar comentário da tarefa no model:", err);
    throw err;
  }
}

module.exports = {
  insertTarefa,
  listTarefasBySprint,
  updateFaseTarefa,
  updateComentarioTarefa,
};

async function getObservacaoTarefa(tarefa_id) {
  try {
    const query = `
      SELECT comentario
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

module.exports = {
  insertTarefa,
  listTarefasBySprint,
  updateFaseTarefa,
  updateComentarioTarefa,
  getObservacaoTarefa,
  getProjetoById,
  getUsuarioById, // adiciona aqui
};
