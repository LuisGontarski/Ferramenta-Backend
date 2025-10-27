// src/routes/relatorio/relatorio.js
const express = require("express");
const router = express.Router();
const relatorioController = require("../../controllers/relatorio/relatorioController");

router.post("/relatorio/projeto", relatorioController.gerarRelatorioProjetoCompleto);

module.exports = router;