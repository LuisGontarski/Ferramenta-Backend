const db = require("../db/db");
const { v4: uuidv4 } = require("uuid");

// Criar Tarefa
exports.createTarefa = async (fields) => {
  const tarefa_id = uuidv4();
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
    nome
  } = fields;

  const result = await db.query(
    `INSERT INTO tarefa (
      tarefa_id, titulo, descricao, responsavel_id, prioridade, tipo,
      data_inicio_prevista, data_termino_prevista, data_inicio_real, data_termino_real,
      projeto_id, nome, data_criacao
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
    RETURNING *`,
    [
      tarefa_id, titulo, descricao, responsavel_id, prioridade, tipo,
      data_inicio_prevista, data_termino_prevista, data_inicio_real, data_termino_real,
      projeto_id, nome
    ]
  );

  return result.rows[0];
};

// Listar todas as tarefas
exports.getTarefas = async () => {
  const result = await db.query(
    `SELECT * FROM tarefa`
  );
  return result.rows;
};

// Obter tarefa por ID
exports.getTarefaById = async (id) => {
  const result = await db.query(
    `SELECT * FROM tarefa WHERE tarefa_id = $1`,
    [id]
  );
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
    status
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
      titulo, descricao, responsavel_id, prioridade, tipo,
      data_inicio_prevista, data_termino_prevista, data_inicio_real, data_termino_real,
      projeto_id, nome, status, id
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