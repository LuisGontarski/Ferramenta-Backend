const express = require("express");
const router = express.Router();
const multer = require("multer");
const documentoController = require("../../controllers/documento/documentoController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Rotas corrigidas para usar as funções do controller importado
router.post("/upload", upload.single('arquivo'), documentoController.uploadDocumento);
router.get("/documentos/:projeto_id", documentoController.getDocumentos); // Rota para listar
router.delete("/documentos/:documento_id", documentoController.deletarDocumento); // Rota para deletar

module.exports = router;