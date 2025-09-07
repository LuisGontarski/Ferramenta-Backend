const puppeteer = require("puppeteer");
const { getCommitsByUsuario } = require("../../model/relatorioModel");

exports.gerarRelatorioCommits = async (req, res) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id é obrigatório" });
  }

  try {
    const commits = await getCommitsByUsuario(usuario_id);

    // Estatísticas
    const totalCommits = commits.length;
    const ultimoCommit = commits[0] ? new Date(commits[0].data_commit).toLocaleString() : "N/A";

    // Contagem por projeto para gráfico
    const projetoCount = {};
    commits.forEach(c => {
      projetoCount[c.projeto_nome] = (projetoCount[c.projeto_nome] || 0) + 1;
    });

    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Commits</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background: #f0f0f0; }
            canvas { margin-top: 30px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Commits</h1>
          <p>Gerado em ${new Date().toLocaleString()}</p>
          <h2>Total de Commits: ${totalCommits} | Último Commit: ${ultimoCommit}</h2>

          <table>
            <tr>
              <th>Mensagem</th>
              <th>Data</th>
              <th>Projeto</th>
            </tr>
            ${commits.map(c => `
              <tr>
                <td>${c.mensagem || '-'}</td>
                <td>${new Date(c.data_commit).toLocaleString()}</td>
                <td>${c.projeto_nome}</td>
              </tr>
            `).join("")}
          </table>

          <canvas id="grafico" width="400" height="200"></canvas>

          <script>
            const ctx = document.getElementById('grafico').getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(Object.keys(projetoCount))},
                datasets: [{
                  label: 'Commits por Projeto',
                  data: ${JSON.stringify(Object.values(projetoCount))},
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                }]
              },
              options: { scales: { y: { beginAtZero: true } } }
            });
          </script>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({ format: "A4" });
    await browser.close();

    res.contentType("application/pdf");
    res.send(pdf);

  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).send("Erro ao gerar relatório");
  }
};
