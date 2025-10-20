const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadDocumentos, // Nome correto da função importada
  listarDocumentos,
  deletarDocumento,
} = require("../../controllers/documento/documentoController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), 
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// --- CORREÇÃO APLICADA AQUI ---
router.post("/upload", upload.single('arquivo'), uploadDocumentos); 

router.get("/list/:projeto_id", listarDocumentos);
router.delete("/documentos/:documento_id", deletarDocumento);

module.exports = router;