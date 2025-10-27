const puppeteer = require("puppeteer");
const { getProjectReport, getProjectMetrics } = require("../../model/projectModel"); // Ajuste o caminho se necessário

// Funções auxiliares (mantidas iguais)
const formatDate = (dateString) => {
    // ... (código de formatação de data) ...
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("pt-BR", {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return "N/A";
    }
};
const formatPercentage = (value) => {
    // ... (código de formatação de porcentagem) ...
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return `${(value * 100).toFixed(1)}%`;
};
const formatDays = (days) => {
   // ... (código de formatação de dias) ...
    if (days === null || days === undefined || isNaN(days)) return "N/A";
    return `${parseFloat(days).toFixed(1)} dias`;
};


exports.gerarRelatorioProjetoCompleto = async (req, res) => {
    const { projeto_id } = req.body;

    if (!projeto_id) {
        return res.status(400).json({ error: "projeto_id é obrigatório" });
    }

    try {
        const [projectReport, projectMetrics] = await Promise.all([
            getProjectReport(projeto_id),
            getProjectMetrics(projeto_id)
        ]);

        const reportData = {
            ...projectReport,
            metricas_detalhadas: projectMetrics
        };


        if (!reportData || !reportData.projeto) {
            return res.status(404).json({ error: "Dados do projeto não encontrados." });
        }

        const {
            projeto,
            equipe,
            resumo_tarefas,
            metricas_detalhadas
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
          <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>

          <h2>Informações Gerais</h2>
          <div class="grid">
             <div class="metric-card"><strong>Status:</strong> <span>${projeto.status || 'N/A'}</span></div>
             <div class="metric-card"><strong>Início:</strong> <span>${formatDate(projeto.data_inicio)}</span></div>
             <div class="metric-card"><strong>Fim Previsto:</strong> <span>${formatDate(projeto.data_fim_prevista)}</span></div>
             <div class="metric-card"><strong>Gerente:</strong> <span>${projeto.criador_nome || 'N/A'}</span></div>
             <div class="metric-card"><strong>Equipe Principal:</strong> <span>${projeto.equipe_nome || 'N/A'}</span></div>
             <div class="metric-card"><strong>Sprint Atual:</strong> <span>${projeto.sprint_atual_nome || 'Nenhuma'}</span></div>
           </div>

          <div class="page-break"></div>

          <h2>Resumo de Tarefas</h2>
          <div class="grid">
              <div class="metric-card"><strong>Total:</strong> <span>${resumo_tarefas?.total_tarefas ?? 0}</span></div>
              <div class="metric-card"><strong>Concluídas:</strong> <span>${resumo_tarefas?.tarefas_concluidas ?? 0}</span> <span class="detail">(${formatPercentage((resumo_tarefas?.tarefas_concluidas ?? 0) / (resumo_tarefas?.total_tarefas || 1))})</span></div>
              <div class="metric-card"><strong>Em Andamento:</strong> <span>${resumo_tarefas?.tarefas_andamento ?? 0}</span></div>
              <div class="metric-card"><strong>Pendentes:</strong> <span>${resumo_tarefas?.tarefas_pendentes ?? 0}</span></div>
              <div class="metric-card"><strong>Total SP:</strong> <span>${resumo_tarefas?.total_story_points ?? 0}</span></div>
              <div class="metric-card"><strong>SP Concluídos:</strong> <span>${resumo_tarefas?.story_points_concluidos ?? 0}</span> <span class="detail">(${formatPercentage((resumo_tarefas?.story_points_concluidos ?? 0) / (resumo_tarefas?.total_story_points || 1))})</span></div>
          </div>

          <h2>Métricas de Desempenho</h2>
           <div class="grid">
              <div class="metric-card"><strong>Velocidade Média:</strong> <span>${metricas_detalhadas?.velocidade?.velocidade_media?.toFixed(1) ?? 'N/A'}</span> <span class="detail">SP/sprint</span></div>
             <div class="metric-card"><strong>Lead Time Médio:</strong> <span>${formatDays(metricas_detalhadas?.tempos_entrega?.lead_time_medio_dias)}</span></div>
             <div class="metric-card"><strong>Cycle Time Médio:</strong> <span>${formatDays(metricas_detalhadas?.tempos_entrega?.cycle_time_medio_dias)}</span></div>
             <div class="metric-card"><strong>Taxa Conclusão Tarefas:</strong> <span>${formatPercentage(metricas_detalhadas?.taxas_conclusao?.taxa_conclusao_tarefas)}</span></div>
             <div class="metric-card"><strong>Taxa Entrega no Prazo:</strong> <span>${formatPercentage(metricas_detalhadas?.taxas_conclusao?.tarefas_entregues_no_prazo)}</span></div>
             <div class="metric-card"><strong>Tarefas Reabertas:</strong> <span>${metricas_detalhadas?.qualidade?.tarefas_reabertas ?? 0}</span></div>
           </div>

           <div class="page-break"></div>

           <h2>Equipe (${equipe?.length ?? 0} membros)</h2>
           ${equipe && equipe.length > 0 ? `
            <table>
              <thead><tr><th>Nome</th><th>Email</th><th>Cargo</th><th>GitHub</th></tr></thead>
              <tbody>
              ${equipe.map(m => `
                <tr>
                  <td>${m.nome_usuario || 'N/A'}</td>
                  <td>${m.email || 'N/A'}</td>
                  <td>${m.cargo || 'N/A'}</td>
                  <td>${m.github || 'N/A'}</td>
                </tr>
              `).join('')}
              </tbody>
            </table>
          ` : '<p class="text-left">Nenhum membro na equipe.</p>'}
        </body>
      </html>
    `;

        // --- Geração do PDF (Lógica mantida) ---
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            preferCSSPageSize: true
        });
        await browser.close();

        res.contentType("application/pdf");
        res.send(pdf);

    } catch (err) {
        console.error("Erro ao gerar relatório completo:", err);
        res.status(500).json({ error: `Erro ao gerar relatório: ${err.message || err}` });
    }
};

