const documentoModel = require("../../model/documentoModel");
const path = require("path");

// Renomeado de 'uploadDocumentos' para 'uploadDocumento' para consistência
exports.uploadDocumento = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }

  const { projeto_id } = req.body;
  if (!projeto_id) {
    return res.status(400).json({ message: "O ID do projeto é obrigatório." });
  }

  try {
    const documento = {
      projeto_id: projeto_id,
      nome_arquivo: req.file.originalname,
      caminho_arquivo: req.file.path,
      tipo_arquivo: req.file.mimetype,
      tamanho_arquivo: req.file.size,
    };

    const novoDocumento = await documentoModel.insertDocumento(documento);

    res.status(201).json({
      message: "Arquivo salvo com sucesso!",
      documento: novoDocumento,
    });
  } catch (error) {
    console.error("Erro ao salvar documento:", error);
    res.status(500).json({ message: "Erro interno ao salvar o documento." });
  }
};

// Renomeado de 'listarDocumentos' para 'getDocumentos'
exports.getDocumentos = async (req, res) => {
    const { projeto_id } = req.params;
    try {
        const documentos = await documentoModel.getDocumentosByProjeto(projeto_id);
        res.status(200).json(documentos);
    } catch (error) {
        console.error("Erro no controller ao buscar documentos:", error);
        res.status(500).json({ message: "Erro ao buscar documentos." });
    }
};

exports.deletarDocumento = async (req, res) => {
    const { documento_id } = req.params;
    try {
        const docDeletado = await documentoModel.deleteDocumentoById(documento_id);
        if (!docDeletado) {
            return res.status(404).json({ message: "Documento não encontrado." });
        }
        res.status(200).json({ message: "Documento deletado com sucesso." });
    } catch (error) {
        console.error("Erro no controller ao deletar documento:", error);
        res.status(500).json({ message: "Erro ao deletar documento." });
    }
};