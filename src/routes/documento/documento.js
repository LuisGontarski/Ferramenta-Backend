const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadDocumentos,
  listarDocumentos,
  deletarDocumento,
} = require("../../controllers/documentoController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // pasta onde os arquivos vão ficar
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/upload/:projeto_id", upload.array("arquivos"), uploadDocumentos);
router.get("/list/:projeto_id", listarDocumentos);
router.delete("/:documento_id", deletarDocumento);

module.exports = router;
