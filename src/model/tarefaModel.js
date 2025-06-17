const db = require("../db/db"); // certifique-se que db exporta o pool/configuração do pg
const { v4: uuidv4 } = require("uuid");

exports.createTarefa = async (titulo, nome, prioridade) => {
  const tarefa_id = uuidv4();
  const result = await db.query(
    `INSERT INTO tarefa (tarefa_id, titulo, nome, prioridade, data_criacao)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [tarefa_id, titulo, nome, prioridade]
  );
  return result.rows[0];
};

exports.getTarefas = async () => {
  const result = await db.query(
    `SELECT tarefa_id, titulo, responsavel_id, data_criacao, prioridade FROM tarefa`
  );
  return result.rows;
};

exports.getTarefaById = async (id) => {
  const result = await db.query(
    `SELECT tarefa_id, titulo, responsavel_id, data_criacao, prioridade 
     FROM tarefa WHERE tarefa_id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.updateTarefa = async (id, titulo, responsavel_id, prioridade) => {
  const result = await db.query(
    `UPDATE tarefa 
     SET titulo = $1, responsavel_id = $2, prioridade = $3 
     WHERE tarefa_id = $4 RETURNING *`,
    [titulo, responsavel_id, prioridade, id]
  );
  return result.rows[0];
};

exports.deleteTarefa = async (id) => {
  const result = await db.query(
    `DELETE FROM tarefa WHERE tarefa_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};
