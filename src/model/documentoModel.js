const pool = require("../db/db"); // <-- A importação correta que estava faltando no controller

async function insertDocumento(documento) {
  const {
    projeto_id,
    nome_arquivo,
    caminho_arquivo,
    tipo_arquivo,
    tamanho_arquivo,
  } = documento;

  const query = `
    INSERT INTO documento (projeto_id, nome_arquivo, caminho_arquivo, tipo_arquivo, tamanho_arquivo, criado_em)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *;
  `;

  const values = [
    projeto_id,
    nome_arquivo,
    caminho_arquivo,
    tipo_arquivo,
    tamanho_arquivo,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Erro no model ao inserir documento:", error);
    throw error;
  }
}

async function getDocumentosByProjeto(projeto_id) {
    const query = `
      SELECT *
      FROM documento
      WHERE projeto_id = $1 
      ORDER BY criado_em DESC;
    `;
    try {
        const result = await pool.query(query, [projeto_id]);
        return result.rows;
    } catch (error) {
        console.error("Erro no model ao buscar documentos:", error);
        throw error;
    }
}

async function deleteDocumentoById(documento_id) {
    const query = `
        DELETE FROM documento
        WHERE documento_id = $1
        RETURNING *;
    `;
    try {
        const result = await pool.query(query, [documento_id]);
        return result.rows[0]; // Retorna o documento deletado ou undefined se não encontrar
    } catch (error) {
        console.error("Erro no model ao deletar documento:", error);
        throw error;
    }
}

module.exports = {
  insertDocumento,
  getDocumentosByProjeto,
  deleteDocumentoById,
};