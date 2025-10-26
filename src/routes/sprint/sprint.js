const express = require("express");
const db = require("../../db/db");
const router = express.Router();
const sprintController = require("../../controllers/sprint/sprintController");

router.post("/sprint", sprintController.createSprint);
router.get("/sprint/:projeto_id", sprintController.getSprintsByProject);
router.delete("/sprint/:sprint_id", sprintController.deleteSprint);

// 📈 Rota do burndown
router.get('/sprint/:id/burndown', async (req, res) => {
    const sprintId = req.params.id;

    try {
        const sprintResult = await db.query(
            "SELECT nome, story_points, dias_sprint, data_inicio, data_fim FROM sprint WHERE sprint_id = $1",
            [sprintId]
        );
        const sprint = sprintResult.rows[0];

        if (!sprint) {
            return res.status(404).json({ message: "Sprint não encontrada" });
        }

        const totalStoryPoints = sprint.story_points || 0;
        let diasSprint = sprint.dias_sprint || 0;
        const dataInicioSprint = sprint.data_inicio ? new Date(sprint.data_inicio) : null;
        const dataFimSprint = sprint.data_fim ? new Date(sprint.data_fim) : null;

        if (diasSprint <= 0 && dataInicioSprint && dataFimSprint && dataInicioSprint <= dataFimSprint) {
           const diffTime = Math.abs(dataFimSprint.getTime() - dataInicioSprint.getTime());
           diasSprint = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
           console.log(`Dias da sprint calculados pelas datas: ${diasSprint}`);
        } else if (diasSprint <= 0) {
            console.warn(`Sprint ${sprintId} não tem dias_sprint definidos nem datas válidas para cálculo.`);
            diasSprint = 1;
        }

        if (!dataInicioSprint) {
            console.error(`Sprint ${sprintId} não tem data de início definida.`);
            return res.status(400).json({ message: "Data de início da sprint não definida." });
        }

        const tarefasResult = await db.query(`
            SELECT
                DATE(data_fim_real AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AS dia_conclusao,
                SUM(COALESCE(story_points, 0)) AS concluidos_no_dia
            FROM tarefa
            WHERE sprint_id = $1
              AND fase_tarefa = 'Feito'
              AND data_fim_real IS NOT NULL
              AND story_points IS NOT NULL
            GROUP BY dia_conclusao
            ORDER BY dia_conclusao ASC;
        `, [sprintId]);

        const tarefasConcluidasPorDia = tarefasResult.rows.reduce((acc, row) => {
            const diaFormatado = new Date(row.dia_conclusao).toISOString().split('T')[0];
            acc[diaFormatado] = parseInt(row.concluidos_no_dia, 10);
            return acc;
        }, {});
        console.log("Tarefas concluídas por dia:", tarefasConcluidasPorDia);

        // --- INÍCIO DA LÓGICA CORRIGIDA ---
        const pontosConcluidosAcumuladosPorDia = {};
        let acumulado = 0;
        const diasOrdenados = Object.keys(tarefasConcluidasPorDia).sort(); // Ordena as datas

        // Pré-calcula os pontos acumulados *apenas para os dias onde houve conclusão*
        diasOrdenados.forEach(dia => {
            acumulado += tarefasConcluidasPorDia[dia];
            pontosConcluidosAcumuladosPorDia[dia] = acumulado;
        });
        console.log("Pontos concluídos acumulados por dia:", pontosConcluidosAcumuladosPorDia);

        const burndownData = [];
        let ultimoValorAcumuladoConhecido = 0; // Guarda o último valor acumulado visto

        // Adiciona um ponto inicial (Dia 0) para o gráfico começar do total (opcional, mas bom)
        /*
        burndownData.push({
             dia: `Dia 0`,
             planejado: totalStoryPoints,
             real: totalStoryPoints,
        });
        */

        // Itera pelos dias da sprint
        for (let i = 0; i < diasSprint; i++) {
            const diaAtual = new Date(dataInicioSprint);
            diaAtual.setUTCDate(dataInicioSprint.getUTCDate() + i);
            const diaAtualFormatado = diaAtual.toISOString().split('T')[0];

            // Verifica se houve conclusão *neste dia específico* ou *antes*
            // Se houve conclusão hoje, atualiza o último valor conhecido
            if (pontosConcluidosAcumuladosPorDia[diaAtualFormatado] !== undefined) {
                 ultimoValorAcumuladoConhecido = pontosConcluidosAcumuladosPorDia[diaAtualFormatado];
            }
            // Se não houve conclusão hoje, o valor acumulado continua sendo o último conhecido

            // Pontos restantes = Total inicial - Total acumulado concluído ATÉ este dia
            const pontosRestantesReal = Math.max(0, totalStoryPoints - ultimoValorAcumuladoConhecido);

            // Cálculo da linha planejada (ideal) - continua igual
            const pontosPlanejados = Math.max(0, totalStoryPoints - (totalStoryPoints / diasSprint) * (i + 1));

            burndownData.push({
                dia: `Dia ${i + 1}`, // Label para o gráfico
                planejado: parseFloat(pontosPlanejados.toFixed(2)),
                real: pontosRestantesReal, // Usa os pontos restantes calculados acumulativamente
            });
        }
        // --- FIM DA LÓGICA CORRIGIDA ---

        console.log("Dados do Burndown calculados (REVISADO):", burndownData);

        res.json(burndownData);
    } catch (error) {
        console.error("Erro ao calcular burndown:", error);
        res.status(500).json({ message: "Erro ao calcular burndown." });
    }
});

module.exports = router;
