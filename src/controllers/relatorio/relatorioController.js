const puppeteer = require("puppeteer");
const {
  getProjectReport,
  getProjectMetrics,
} = require("../../model/projectModel"); // Ajuste o caminho se necessário

// Funções auxiliares (mantidas iguais)
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch {
    return "N/A";
  }
}

function formatPercentage(value) {
  if (value === null || value === undefined) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDays(days) {
  if (days === null || days === undefined) return "N/A";
  return `${days.toFixed(1)} dias`;
}

exports.gerarRelatorioProjetoCompleto = async (req, res) => {
  const { projeto_id } = req.body;

  if (!projeto_id) {
    return res.status(400).json({ error: "projeto_id é obrigatório" });
  }

  try {
    const [projectReport, projectMetrics] = await Promise.all([
      getProjectReport(projeto_id),
      getProjectMetrics(projeto_id),
    ]);

    const reportData = {
      ...projectReport,
      metricas_detalhadas: projectMetrics,
    };

    if (!reportData || !reportData.projeto) {
      return res
        .status(404)
        .json({ error: "Dados do projeto não encontrados." });
    }

    const {
      projeto,
      equipe,
      resumo_tarefas,
      metricas_detalhadas,
      // Adicione outras seções conforme necessário
    } = reportData;

    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório Completo - ${projeto.nome}</title>
          <style>
             /* ... (Seus estilos CSS aqui) ... */
             body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 25px; font-size: 9pt; color: #333; }
            h1 { font-size: 16pt; margin-bottom: 5px; text-align: center; }
            h2 { font-size: 12pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; text-align: left; color: #1d4ed8; }
            h3 { font-size: 10pt; margin-top: 15px; margin-bottom: 8px; text-align: left; color: #444; }
            p { text-align: center; font-size: 8pt; color: #666; margin-bottom: 15px;}
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8pt; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; word-break: break-word; }
            th { background-color: #f2f7ff; font-weight: bold; color: #333; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 10px; margin-bottom: 20px;}
            .metric-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background-color: #f8fafc; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .metric-card strong { display: block; font-size: 9pt; color: #1d4ed8; margin-bottom: 4px; font-weight: 600; }
            .metric-card span { font-size: 11pt; color: #1f2937; font-weight: bold; }
            .metric-card .detail { font-size: 8pt; color: #6b7280; font-weight: normal; margin-top: 2px;}
            .page-break { page-break-after: always; }
            .text-left { text-align: left !important; }
          </style>
        </head>
        <body>
          <h1>Relatório Completo do Projeto</h1>
          <h2>${projeto.nome}</h2>
          <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>

          <h2>Informações Gerais</h2>
          <div class="grid">
             <div class="metric-card"><strong>Status:</strong> <span>${
               projeto.status || "N/A"
             }</span></div>
             <div class="metric-card"><strong>Início:</strong> <span>${formatDate(
               projeto.data_inicio
             )}</span></div>
             <div class="metric-card"><strong>Fim Previsto:</strong> <span>${formatDate(
               projeto.data_fim_prevista
             )}</span></div>
             <div class="metric-card"><strong>Gerente:</strong> <span>${
               projeto.criador_nome || "N/A"
             }</span></div>
             <div class="metric-card"><strong>Equipe Principal:</strong> <span>${
               projeto.equipe_nome || "N/A"
             }</span></div>
             <div class="metric-card"><strong>Sprint Atual:</strong> <span>${
               projeto.sprint_atual_nome || "Nenhuma"
             }</span></div>
           </div>

          <div class="page-break"></div>

          <h2>Resumo de Tarefas</h2>
          <div class="grid">
              <div class="metric-card"><strong>Total:</strong> <span>${
                resumo_tarefas?.total_tarefas ?? 0
              }</span></div>
              <div class="metric-card"><strong>Concluídas:</strong> <span>${
                resumo_tarefas?.tarefas_concluidas ?? 0
              }</span> <span class="detail">(${formatPercentage(
      (resumo_tarefas?.tarefas_concluidas ?? 0) /
        (resumo_tarefas?.total_tarefas || 1)
    )})</span></div>
              <div class="metric-card"><strong>Em Andamento:</strong> <span>${
                resumo_tarefas?.tarefas_andamento ?? 0
              }</span></div>
              <div class="metric-card"><strong>Pendentes:</strong> <span>${
                resumo_tarefas?.tarefas_pendentes ?? 0
              }</span></div>
              <div class="metric-card"><strong>Total SP:</strong> <span>${
                resumo_tarefas?.total_story_points ?? 0
              }</span></div>
              <div class="metric-card"><strong>SP Concluídos:</strong> <span>${
                resumo_tarefas?.story_points_concluidos ?? 0
              }</span> <span class="detail">(${formatPercentage(
      (resumo_tarefas?.story_points_concluidos ?? 0) /
        (resumo_tarefas?.total_story_points || 1)
    )})</span></div>
          </div>

          <h2>Métricas de Desempenho</h2>
           <div class="grid">
              <div class="metric-card"><strong>Velocidade Média:</strong> <span>${
                metricas_detalhadas?.velocidade?.velocidade_media?.toFixed(1) ??
                "N/A"
              }</span> <span class="detail">SP/sprint</span></div>
             <div class="metric-card"><strong>Lead Time Médio:</strong> <span>${formatDays(
               metricas_detalhadas?.tempos_entrega?.lead_time_medio_dias
             )}</span></div>
             <div class="metric-card"><strong>Cycle Time Médio:</strong> <span>${formatDays(
               metricas_detalhadas?.tempos_entrega?.cycle_time_medio_dias
             )}</span></div>
             <div class="metric-card"><strong>Taxa Conclusão Tarefas:</strong> <span>${formatPercentage(
               metricas_detalhadas?.taxas_conclusao?.taxa_conclusao_tarefas
             )}</span></div>
             <div class="metric-card"><strong>Taxa Entrega no Prazo:</strong> <span>${formatPercentage(
               metricas_detalhadas?.taxas_conclusao?.tarefas_entregues_no_prazo
             )}</span></div>
             <div class="metric-card"><strong>Tarefas Reabertas:</strong> <span>${
               metricas_detalhadas?.qualidade?.tarefas_reabertas ?? 0
             }</span></div>
           </div>

           <div class="page-break"></div>

           <h2>Equipe (${equipe?.length ?? 0} membros)</h2>
           ${
             equipe && equipe.length > 0
               ? `
            <table>
              <thead><tr><th>Nome</th><th>Email</th><th>Cargo</th><th>GitHub</th></tr></thead>
              <tbody>
              ${equipe
                .map(
                  (m) => `
                <tr>
                  <td>${m.nome_usuario || "N/A"}</td>
                  <td>${m.email || "N/A"}</td>
                  <td>${m.cargo || "N/A"}</td>
                  <td>${m.github || "N/A"}</td>
                </tr>
              `
                )
                .join("")}
              </tbody>
            </table>
          `
               : '<p class="text-left">Nenhum membro na equipe.</p>'
           }
        </body>
      </html>
    `;

    // --- Geração do PDF (Lógica mantida) ---
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      preferCSSPageSize: true,
    });
    await browser.close();

    res.contentType("application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error("Erro ao gerar relatório completo:", err);
    res
      .status(500)
      .json({ error: `Erro ao gerar relatório: ${err.message || err}` });
  }
};

const CORES_GRAFICO = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

exports.obterDadosRelatorioProjeto = async (req, res) => {
  const { projeto_id } = req.params;

  if (!projeto_id) {
    return res.status(400).json({ error: "projeto_id é obrigatório" });
  }

  try {
    const [projectReport, projectMetrics] = await Promise.all([
      getProjectReport(projeto_id),
      getProjectMetrics(projeto_id),
    ]);

    // Processar dados para o frontend simplificado
    const dadosSimplificados = {
      projeto: projectReport.projeto,
      equipe: projectReport.equipe || [],
      metricas: {
        // Velocidade
        velocidade_media: projectMetrics.velocidade?.velocidade_media || 0,
        sprints_analisadas: projectMetrics.velocidade?.sprints_analisadas || 0,

        // Tarefas
        total_tarefas: projectReport.resumo_tarefas?.total_tarefas || 0,
        tarefas_concluidas:
          projectReport.resumo_tarefas?.tarefas_concluidas || 0,
        tarefas_andamento: projectReport.resumo_tarefas?.tarefas_andamento || 0,
        tarefas_pendentes: projectReport.resumo_tarefas?.tarefas_pendentes || 0,
        taxa_conclusao_tarefas:
          projectMetrics.taxas_conclusao?.taxa_conclusao_tarefas || 0,

        // Story Points
        total_story_points:
          projectReport.resumo_tarefas?.total_story_points || 0,
        story_points_concluidos:
          projectReport.resumo_tarefas?.story_points_concluidos || 0,
        taxa_conclusao_sp:
          (projectReport.resumo_tarefas?.story_points_concluidos || 0) /
          (projectReport.resumo_tarefas?.total_story_points || 1),

        // Tempos
        lead_time_medio_dias:
          projectMetrics.tempos_entrega?.lead_time_medio_dias || 0,
        cycle_time_medio_dias:
          projectMetrics.tempos_entrega?.cycle_time_medio_dias || 0,

        // Qualidade
        tarefas_reabertas: projectMetrics.qualidade?.tarefas_reabertas || 0,
        taxa_entrega_prazo:
          projectMetrics.taxas_conclusao?.tarefas_entregues_no_prazo || 0,

        // Distribuição
        total_membros:
          projectMetrics.distribuicao_trabalho?.total_membros_equipe || 0,
        membros_ativos:
          projectMetrics.distribuicao_trabalho?.membros_com_tarefas || 0,
        media_tarefas_por_membro:
          projectMetrics.distribuicao_trabalho?.media_tarefas_por_membro || 0,
      },
      dados_graficos: {
        tarefas_por_status: [
          {
            status: "Concluída",
            quantidade: projectReport.resumo_tarefas?.tarefas_concluidas || 0,
            cor: "#00C49F",
          },
          {
            status: "Em Andamento",
            quantidade: projectReport.resumo_tarefas?.tarefas_andamento || 0,
            cor: "#0088FE",
          },
          {
            status: "Pendente",
            quantidade: projectReport.resumo_tarefas?.tarefas_pendentes || 0,
            cor: "#FFBB28",
          },
        ],
        velocidade_sprints:
          projectMetrics.sprints_concluidas?.map((sprint) => ({
            sprint_nome: sprint.nome,
            story_points_concluidos: sprint.story_points_concluidos,
          })) || [],
        tarefas_por_prioridade:
          projectReport.tarefas_por_prioridade?.map((item, index) => ({
            prioridade: item.prioridade,
            quantidade: item.quantidade,
            cor: CORES_GRAFICO[index % CORES_GRAFICO.length],
          })) || [],
      },
    };

    res.json({
      success: true,
      data: dadosSimplificados,
      metadata: {
        projeto_nome: projectReport.projeto.nome,
        data_geracao: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Erro ao obter dados do relatório:", err);
    res.status(500).json({
      error: `Erro ao obter dados do relatório: ${err.message || err}`,
    });
  }
};

// exports.gerarPDFFromData = async (req, res) => {
//   const reportData = req.body;

//   if (!reportData || !reportData.projeto) {
//     return res
//       .status(400)
//       .json({ error: "Dados do relatório são obrigatórios" });
//   }

//   try {
//     const pdf = await generatePDFFromData(reportData);

//     res.contentType("application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="relatorio-${reportData.projeto.nome}.pdf"`
//     );
//     res.send(pdf);
//   } catch (err) {
//     console.error("Erro ao gerar PDF:", err);
//     res.status(500).json({ error: `Erro ao gerar PDF: ${err.message || err}` });
//   }
// };

// Função reutilizável para gerar PDF
exports.gerarPDFFromData = async (req, res) => {
  const reportData = req.body;

  if (!reportData || !reportData.projeto) {
    return res
      .status(400)
      .json({ error: "Dados do relatório são obrigatórios" });
  }

  try {
    const pdf = await generatePDFCompleto(reportData);

    res.contentType("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="relatorio-${reportData.projeto.nome}.pdf"`
    );
    res.send(pdf);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({ error: `Erro ao gerar PDF: ${err.message || err}` });
  }
};

// Função melhorada para gerar PDF completo
async function generatePDFCompleto(reportData) {
  const { projeto, equipe, metricas, dados_graficos, insights } = reportData;

  // Funções auxiliares para formatação
  const formatarData = (dataString) => {
    if (!dataString) return "N/A";
    try {
      return new Date(dataString).toLocaleDateString("pt-BR");
    } catch {
      return "N/A";
    }
  };

  const formatarPorcentagem = (valor) => {
    if (valor === null || valor === undefined) return "0%";
    return `${(valor * 100).toFixed(1)}%`;
  };

  const formatarDias = (dias) => {
    if (dias === null || dias === undefined) return "N/A";
    return `${dias.toFixed(1)} dias`;
  };

  // Calcular progresso geral
  const progressoGeral = metricas.taxa_conclusao_tarefas * 100;

  let html = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Completo - ${projeto.nome}</title>
        <style>
          /* Reset e configurações básicas */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            padding: 25px; 
            font-size: 10pt; 
            color: #333; 
            line-height: 1.4;
          }
          
          /* Cabeçalho */
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #1d4ed8;
            padding-bottom: 20px;
          }
          .title { 
            font-size: 24pt; 
            color: #1d4ed8;
            margin-bottom: 10px;
          }
          .subtitle { 
            font-size: 14pt; 
            color: #666;
            margin-bottom: 15px;
          }
          .metadata { 
            font-size: 9pt; 
            color: #888;
          }
          
          /* Seções */
          .section { 
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 16pt; 
            color: #1d4ed8;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          /* Grid de métricas */
          .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px;
          }
          .metric-card { 
            border: 1px solid #e2e8f0; 
            padding: 15px; 
            border-radius: 8px; 
            background-color: #f8fafc;
            text-align: center;
          }
          .metric-value { 
            font-size: 20pt; 
            font-weight: bold; 
            color: #1d4ed8;
            margin: 10px 0;
          }
          .metric-label { 
            font-size: 9pt; 
            color: #666;
            font-weight: 600;
          }
          .metric-details {
            font-size: 8pt;
            color: #888;
            margin-top: 5px;
          }
          
          /* Tabelas */
          .table-container {
            margin: 15px 0;
            overflow-x: auto;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
            font-size: 9pt; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #1d4ed8; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          /* Barras de progresso */
          .progress-container {
            width: 100%;
            background-color: #e2e8f0;
            border-radius: 10px;
            margin: 8px 0;
          }
          .progress-bar {
            height: 20px;
            border-radius: 10px;
            text-align: center;
            line-height: 20px;
            color: white;
            font-weight: bold;
            font-size: 8pt;
          }
          
          /* Cards de insights */
          .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .insight-card {
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid;
          }
          .insight-positive {
            background-color: #f0f9ff;
            border-left-color: #00C49F;
          }
          .insight-warning {
            background-color: #fff7ed;
            border-left-color: #FFBB28;
          }
          .insight-info {
            background-color: #f0f9ff;
            border-left-color: #0088FE;
          }
          .insight-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 10pt;
          }
          .insight-list {
            list-style-type: none;
            font-size: 9pt;
          }
          .insight-list li {
            margin-bottom: 5px;
            padding-left: 15px;
            position: relative;
          }
          .insight-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #666;
          }
          
          /* Status badges */
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: bold;
          }
          .status-concluido { background-color: #00C49F; color: white; }
          .status-andamento { background-color: #0088FE; color: white; }
          .status-pendente { background-color: #FFBB28; color: white; }
          .status-atrasado { background-color: #FF6B6B; color: white; }
          
          /* Quebras de página */
          .page-break { 
            page-break-after: always; 
          }
          .avoid-break {
            page-break-inside: avoid;
          }
          
          /* Informações em grid */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 15px 0;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f1f1;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .info-value {
            color: #333;
          }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="header">
          <h1 class="title">Relatório Completo do Projeto</h1>
          <h2 class="subtitle">${projeto.nome}</h2>
          <p class="metadata">Gerado em ${new Date().toLocaleString(
            "pt-BR"
          )} | Período de análise: ${formatarData(
    projeto.data_inicio
  )} a ${formatarData(projeto.data_fim_prevista)}</p>
        </div>

        <!-- Seção 1: Progresso Geral -->
        <div class="section">
          <h2 class="section-title">📊 Progresso Geral do Projeto</h2>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progressoGeral}%; background-color: #00C49F;">
              ${progressoGeral.toFixed(1)}%
            </div>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Tarefas Concluídas</div>
              <div class="metric-value">${metricas.tarefas_concluidas}/${
    metricas.total_tarefas
  }</div>
              <div class="metric-details">${formatarPorcentagem(
                metricas.taxa_conclusao_tarefas
              )}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Story Points</div>
              <div class="metric-value">${metricas.story_points_concluidos}/${
    metricas.total_story_points
  }</div>
              <div class="metric-details">${formatarPorcentagem(
                metricas.taxa_conclusao_sp
              )}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Velocidade Média</div>
              <div class="metric-value">${metricas.velocidade_media?.toFixed(
                1
              )}</div>
              <div class="metric-details">SP por sprint</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Entregas no Prazo</div>
              <div class="metric-value">${formatarPorcentagem(
                metricas.taxa_entrega_prazo
              )}</div>
              <div class="metric-details">Taxa de cumprimento</div>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <!-- Seção 2: Informações do Projeto -->
        <div class="section">
          <h2 class="section-title">📋 Informações do Projeto</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value">
                <span class="status-badge status-${projeto.status?.toLowerCase()}">
                  ${projeto.status}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Data de Início:</span>
              <span class="info-value">${formatarData(
                projeto.data_inicio
              )}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Previsão de Término:</span>
              <span class="info-value">${formatarData(
                projeto.data_fim_prevista
              )}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Equipe Principal:</span>
              <span class="info-value">${projeto.equipe_nome || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gerente do Projeto:</span>
              <span class="info-value">${projeto.criador_nome}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sprint Atual:</span>
              <span class="info-value">${
                projeto.sprint_atual_nome || "Nenhuma"
              }</span>
            </div>
          </div>
        </div>

        <!-- Seção 3: Métricas Detalhadas -->
        <div class="section">
          <h2 class="section-title">📈 Métricas de Desempenho</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Cycle Time Médio</div>
              <div class="metric-value">${formatarDias(
                metricas.cycle_time_medio_dias
              )}</div>
              <div class="metric-details">Tempo médio de conclusão</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Lead Time Médio</div>
              <div class="metric-value">${formatarDias(
                metricas.lead_time_medio_dias
              )}</div>
              <div class="metric-details">Tempo total do processo</div>
            </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Tarefas Reabertas</div>
              <div class="metric-value">${metricas.tarefas_reabertas}</div>
              <div class="metric-details">Indicador de retrabalho</div>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <!-- Seção 4: Distribuição de Tarefas -->
        <div class="section">
          <h2 class="section-title">🎯 Distribuição de Tarefas</h2>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Quantidade</th>
                  <th>Porcentagem</th>
                  <th>Story Points</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="status-badge status-concluido">Concluída</span></td>
                  <td>${metricas.tarefas_concluidas}</td>
                  <td>${formatarPorcentagem(
                    metricas.tarefas_concluidas / metricas.total_tarefas
                  )}</td>
                  <td>${metricas.story_points_concluidos}</td>
                </tr>
                <tr>
                  <td><span class="status-badge status-andamento">Em Andamento</span></td>
                  <td>${metricas.tarefas_andamento}</td>
                  <td>${formatarPorcentagem(
                    metricas.tarefas_andamento / metricas.total_tarefas
                  )}</td>
                  <td>${metricas.story_points_andamento || 0}</td>
                </tr>
                <tr>
                  <td><span class="status-badge status-pendente">Pendente</span></td>
                  <td>${metricas.tarefas_pendentes}</td>
                  <td>${formatarPorcentagem(
                    metricas.tarefas_pendentes / metricas.total_tarefas
                  )}</td>
                  <td>${metricas.story_points_pendentes || 0}</td>
                </tr>
                ${
                  metricas.tarefas_atrasadas > 0
                    ? `
                <tr>
                  <td><span class="status-badge status-atrasado">Atrasada</span></td>
                  <td>${metricas.tarefas_atrasadas}</td>
                  <td>${formatarPorcentagem(
                    metricas.tarefas_atrasadas / metricas.total_tarefas
                  )}</td>
                  <td>-</td>
                </tr>
                `
                    : ""
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Seção 5: Equipe -->
        <div class="section">
          <h2 class="section-title">👥 Equipe do Projeto (${
            equipe.length
          } membros)</h2>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Email</th>
                  <th>GitHub</th>
                </tr>
              </thead>
              <tbody>
                ${equipe
                  .map(
                    (membro) => `
                  <tr>
                    <td>${membro.nome_usuario || "N/A"}</td>
                    <td>${membro.cargo || "N/A"}</td>
                    <td>${membro.email || "N/A"}</td>
                    <td>${membro.github || "N/A"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="page-break"></div>

        <!-- Seção 6: Insights e Recomendações -->
        ${
          insights
            ? `
        <div class="section">
          <h2 class="section-title">💡 Insights e Recomendações</h2>
          <div class="insights-grid">
            <div class="insight-card insight-positive">
              <div class="insight-title">✅ Pontos Fortes</div>
              <ul class="insight-list">
                ${insights.pontos_fortes
                  .map((ponto) => `<li>${ponto}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="insight-card insight-warning">
              <div class="insight-title">⚠️ Áreas de Melhoria</div>
              <ul class="insight-list">
                ${insights.areas_melhoria
                  .map((area) => `<li>${area}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="insight-card insight-info">
              <div class="insight-title">🎯 Recomendações</div>
              <ul class="insight-list">
                ${insights.recomendacoes
                  .map((recomendacao) => `<li>${recomendacao}</li>`)
                  .join("")}
              </ul>
            </div>
          </div>
        </div>
        `
            : ""
        }

        <!-- Rodapé -->
        <div class="section" style="margin-top: 50px; text-align: center; color: #888; font-size: 8pt;">
          <p>Relatório gerado automaticamente pelo Sistema de Gestão de Projetos</p>
          <p>${new Date().toLocaleString("pt-BR")}</p>
        </div>

      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    preferCSSPageSize: true,
  });
  await browser.close();

  return pdf;
}
