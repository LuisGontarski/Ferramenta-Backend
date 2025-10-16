const pool = require("../db"); // seu pool do PostgreSQL

exports.uploadDocumentos = async (req, res) => {
  try {
    const projeto_id = req.params.projeto_id;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    const documentos = req.files.map((file) => ({
      projeto_id,
      nome_arquivo: file.originalname,
      caminho_arquivo: file.path,
      tipo_arquivo: file.mimetype,
      tamanho_arquivo: file.size,
    }));

    const query = `
      INSERT INTO documento (projeto_id, nome_arquivo, caminho_arquivo, tipo_arquivo, tamanho_arquivo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const resultados = [];
    for (const doc of documentos) {
      const result = await pool.query(query, [
        doc.projeto_id,
        doc.nome_arquivo,
        doc.caminho_arquivo,
        doc.tipo_arquivo,
        doc.tamanho_arquivo,
      ]);
      resultados.push(result.rows[0]);
    }

    res.status(200).json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao salvar documentos" });
  }
};

exports.listarDocumentos = async (req, res) => {
  try {
    const projeto_id = req.params.projeto_id;
    const result = await pool.query(
      "SELECT * FROM documento WHERE projeto_id=$1",
      [projeto_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar documentos" });
  }
};

exports.deletarDocumento = async (req, res) => {
  try {
    const documento_id = req.params.documento_id;
    await pool.query("DELETE FROM documento WHERE documento_id=$1", [
      documento_id,
    ]);
    res.status(200).json({ message: "Documento deletado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar documento" });
  }
};
