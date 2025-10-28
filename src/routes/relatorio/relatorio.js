// src/routes/relatorio/relatorio.js
const express = require("express");
const router = express.Router();
const relatorioController = require("../../controllers/relatorio/relatorioController");

router.post(
  "/relatorio/projeto",
  relatorioController.gerarRelatorioProjetoCompleto
);

router.get(
  "/relatorio/projeto/:projeto_id",
  relatorioController.obterDadosRelatorioProjeto
);

router.post(
  "/relatorio/projeto/pdf-from-data",
  relatorioController.gerarPDFFromData
);

module.exports = router;
