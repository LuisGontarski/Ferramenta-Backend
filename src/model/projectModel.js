const pool = require("../db/db");
const { v4: uuidv4 } = require("uuid");

async function getAllProjects() {
  const query = `SELECT * FROM projeto`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Erro ao obter projetos no modelo:", error);
    throw error;
  }
}

async function getProjectsById(id) {
  const query = `SELECT * FROM projeto WHERE projeto_id = $1`;
  const values = [id];
  const result = await pool.query(query, values);
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0];
}

async function createProjectWithTeams({
  nome,
  descricao,
  data_inicio,
  data_fim,
  status,
  criador_id,
  equipes,
  github_repo, // <- ADICIONADO
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Criar projeto
    const projeto_id = uuidv4();
    const projetoQuery = `
      INSERT INTO projeto (projeto_id, nome, descricao, data_inicio, data_fim_prevista, status, criador_id, github_repo, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
      RETURNING projeto_id;
    `;
    await client.query(projetoQuery, [
      projeto_id,
      nome,
      descricao,
      data_inicio,
      data_fim,
      status,
      criador_id,
      github_repo || null, // agora github_repo existe
    ]);

    // Inserir criador diretamente no projeto
    await client.query(
      `INSERT INTO usuario_projeto (usuario_id, projeto_id) VALUES ($1, $2)`,
      [criador_id, projeto_id]
    );

    // 2️⃣ Criar equipes e relacionar
    if (Array.isArray(equipes)) {
      for (const equipe of equipes) {
        const equipe_id = uuidv4();

        // Criar equipe
        await client.query(
          `
          INSERT INTO equipe (equipe_id, nome, descricao, criado_em)
          VALUES ($1, $2, $3, now())
          RETURNING equipe_id;
          `,
          [equipe_id, equipe.nome, equipe.descricao || null]
        );

        // Relacionar equipe ao projeto
        await client.query(
          `INSERT INTO projeto_equipe (projeto_id, equipe_id) VALUES ($1, $2)`,
          [projeto_id, equipe_id]
        );

        // Inserir usuários da equipe (ou apenas o criador)
        const usuariosParaInserir = new Set(equipe.usuarios || []);
        usuariosParaInserir.add(criador_id); // garante que o criador esteja incluso

        for (const usuario_id of usuariosParaInserir) {
          // Inserir na equipe
          await client.query(
            `INSERT INTO usuario_equipe (usuario_id, equipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [usuario_id, equipe_id]
          );

          // Inserir no projeto
          await client.query(
            `INSERT INTO usuario_projeto (usuario_id, projeto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [usuario_id, projeto_id]
          );
        }
      }
    }

    await client.query("COMMIT");
    return { projeto_id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateProject(
  projeto_id,
  { nome, descricao, data_inicio, data_fim_prevista, status }
) {
  const query = `
    UPDATE projeto
    SET 
      nome = $1,
      descricao = $2,
      data_inicio = $3,
      data_fim_prevista = $4,
      status = $5,
      atualizado_em = now()
    WHERE projeto_id = $6
    RETURNING *;
  `;
  const values = [
    nome,
    descricao,
    data_inicio,
    data_fim_prevista,
    status,
    projeto_id,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Erro no model ao atualizar projeto:", err);
    throw err;
  }
}

async function getProjectsByUser(usuario_id) {
  // Query modificada para incluir contagem de tarefas
  const query = `
    SELECT DISTINCT
      p.*,
      COALESCE(uc.total_membros, 1) AS total_membros, -- Usa subquery para contagem correta de membros
      COALESCE(tc.total_tarefas, 0) AS total_tarefas, -- Subquery para total de tarefas
      COALESCE(tcc.tarefas_concluidas, 0) AS tarefas_concluidas -- Subquery para tarefas concluídas
    FROM projeto p
    -- Junta com usuários do projeto para filtrar
    LEFT JOIN usuario_projeto up ON p.projeto_id = up.projeto_id
    -- Subquery para contar membros (exceto criador, que é contado depois se necessário)
    LEFT JOIN (
        SELECT projeto_id, COUNT(DISTINCT usuario_id) AS total_membros
        FROM usuario_projeto
        GROUP BY projeto_id
    ) uc ON p.projeto_id = uc.projeto_id
    -- Subquery para contar o total de tarefas do projeto
    LEFT JOIN (
        SELECT projeto_id, COUNT(tarefa_id) AS total_tarefas
        FROM tarefa
        GROUP BY projeto_id
    ) tc ON p.projeto_id = tc.projeto_id
    -- Subquery para contar tarefas concluídas ('Feito')
    LEFT JOIN (
        SELECT projeto_id, COUNT(tarefa_id) AS tarefas_concluidas
        FROM tarefa
        WHERE fase_tarefa = 'Feito' -- ou o status que indica conclusão
        GROUP BY projeto_id
    ) tcc ON p.projeto_id = tcc.projeto_id
    WHERE up.usuario_id = $1 -- Filtra projetos onde o usuário é membro
    ORDER BY p.criado_em DESC;
  `;
  const values = [usuario_id];

  try {
    const result = await pool.query(query, values);
    // Calcula a porcentagem aqui ou no frontend
    return result.rows.map((projeto) => ({
      ...projeto,
      // Calcula a porcentagem de progresso
      progresso:
        projeto.total_tarefas > 0
          ? Math.round(
              (projeto.tarefas_concluidas / projeto.total_tarefas) * 100
            )
          : 0, // Evita divisão por zero
    }));
  } catch (error) {
    console.error(
      "Erro no model ao buscar projetos do usuário com progresso:",
      error
    );
    throw error;
  }
}

async function getProjectById(projeto_id) {
  const query = `
    SELECT 
      p.projeto_id,
      p.nome,
      p.descricao,
      p.status,
      p.data_inicio,
      p.data_fim_prevista,
      p.criador_id,
      u.nome_usuario AS gerente_projeto,  -- adiciona o nome do criador
      p.criado_em,
      p.github_repo,
      p.atualizado_em,
      COUNT(DISTINCT ue.usuario_id) AS membros_envolvidos
    FROM projeto p
    LEFT JOIN usuario u ON u.usuario_id = p.criador_id  -- join para pegar nome do gerente
    LEFT JOIN projeto_equipe pe ON p.projeto_id = pe.projeto_id
    LEFT JOIN usuario_equipe ue ON pe.equipe_id = ue.equipe_id
    WHERE p.projeto_id = $1
    GROUP BY p.projeto_id, u.nome_usuario  -- precisa agrupar pelo nome do gerente
    LIMIT 1;
  `;
  const values = [projeto_id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Erro no model ao buscar projeto por ID:", error);
    throw error;
  }
}

async function deleteProjectById(projeto_id) {
  const query = `
    DELETE FROM projeto
    WHERE projeto_id = $1
    RETURNING *;
  `;
  const values = [projeto_id];

  try {
    const result = await pool.query(query, values);
    return result.rowCount > 0; // true se deletou, false se não encontrou
  } catch (error) {
    console.error("Erro no model ao deletar projeto:", error);
    throw error;
  }
}

// Buscar usuários de um projeto
async function fetchProjectUsers(projetoId) {
  const query = `
    SELECT u.usuario_id, u.nome_usuario AS nome, u.email
    FROM usuario u
    JOIN usuario_projeto up ON up.usuario_id = u.usuario_id
    WHERE up.projeto_id = $1
  `;

  const values = [projetoId];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Erro ao buscar usuários do projeto:", error);
    throw error;
  }
}

const axios = require("axios");

async function getCommitsByRepo(repoName) {
  try {
    const token = process.env.GITHUB_TOKEN;

    const response = await axios.get(
      `https://api.github.com/repos/LuisGontarski/${repoName}/commits?per_page=30`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.map((c) => ({
      hash_commit: c.sha,
      mensagem: c.commit.message,
      url_commit: c.html_url,
      data_commit: c.commit.author.date,
    }));
  } catch (error) {
    console.error("Erro ao buscar commits do GitHub:", error.message);
    return [];
  }
}

async function getProjectCycleTime(projeto_id) {
  console.log("Calculando cycle time para o projeto:", projeto_id);

  const query = `
    SELECT 
      AVG(EXTRACT(EPOCH FROM (data_fim_real - data_inicio_real))) / 86400 AS cycle_time
    FROM tarefa
    WHERE sprint_id = $1
      AND fase_tarefa = 'Feito'
      AND data_inicio_real IS NOT NULL
      AND data_fim_real IS NOT NULL
  `;
  try {
    const result = await pool.query(query, [projeto_id]);
    let cycleTime = result.rows[0].cycle_time;

    // Se for null ou undefined, retorna 0
    if (!cycleTime) return 0;

    // Converte para float antes de usar toFixed
    cycleTime = parseFloat(cycleTime);

    return parseFloat(cycleTime.toFixed(2));
  } catch (err) {
    console.error("Erro ao calcular cycle time:", err);
    throw err;
  }
}

async function getProjectReport(projectId) {
  const query = `
    WITH project_data AS (
      -- Dados básicos do projeto CORRIGIDO para buscar nomes das equipes
      SELECT
        p.*,
        u.nome_usuario as criador_nome,
        s.nome as sprint_atual_nome,
        -- ✅ Junta os nomes de todas as equipes associadas
        (SELECT STRING_AGG(e.nome, ', ')
         FROM equipe e
         JOIN projeto_equipe pe ON e.equipe_id = pe.equipe_id
         WHERE pe.projeto_id = p.projeto_id) as equipe_nome -- Renomeado para refletir múltiplos nomes se houver
      FROM projeto p
      LEFT JOIN usuario u ON p.criador_id = u.usuario_id
      LEFT JOIN sprint s ON p.sprint_selecionada_id = s.sprint_id
      WHERE p.projeto_id = $1
    ),
    team_members AS (
      -- Membros da equipe do projeto
      SELECT 
        u.usuario_id,
        u.nome_usuario,
        u.email,
        u.cargo,
        u.github
      FROM usuario u
      INNER JOIN usuario_equipe ue ON u.usuario_id = ue.usuario_id
      INNER JOIN projeto_equipe pe ON ue.equipe_id = pe.equipe_id
      WHERE pe.projeto_id = $1
    ),
    tasks_summary AS (
      -- Resumo de tarefas CORRIGIDO para usar fase_tarefa
      SELECT
        COUNT(*) as total_tarefas,
        -- ✅ Conta como concluída se a fase for 'Feito'
        COUNT(CASE WHEN t.fase_tarefa = 'Feito' THEN 1 END) as tarefas_concluidas,
        -- ✅ Conta como em andamento se a fase for 'Executar' ou 'Revisar'
        COUNT(CASE WHEN t.fase_tarefa IN ('Executar', 'Revisar') THEN 1 END) as tarefas_andamento,
        -- ✅ Conta como pendente se a fase for 'Backlog' ou 'Para Fazer' (ou qualquer outra não concluída/andamento)
        COUNT(CASE WHEN t.fase_tarefa IN ('Backlog', 'Para Fazer') THEN 1 END) as tarefas_pendentes,
        COALESCE(SUM(t.story_points), 0) as total_story_points,
         -- ✅ Soma SPs apenas se a fase for 'Feito'
        COALESCE(SUM(CASE WHEN t.fase_tarefa = 'Feito' THEN t.story_points ELSE 0 END), 0) as story_points_concluidos,
        -- Mantém o cálculo de cycle time como estava, assumindo que cycle_time_dias está correto
        AVG(t.cycle_time_dias) as cycle_time_medio
      FROM tarefa t
      WHERE t.projeto_id = $1
    ),
    tasks_by_priority AS (
      -- Tarefas por prioridade
      SELECT 
        t.prioridade,
        COUNT(*) as quantidade,
        COALESCE(SUM(t.story_points), 0) as story_points
      FROM tarefa t
      WHERE t.projeto_id = $1
      GROUP BY t.prioridade
    ),
    tasks_by_status AS (
      -- Tarefas por status
      SELECT 
        t.status,
        COUNT(*) as quantidade
      FROM tarefa t
      WHERE t.projeto_id = $1
      GROUP BY t.status
    ),
    requirements_summary AS (
      -- Resumo de requisitos
      SELECT 
        COUNT(*) as total_requisitos,
        COUNT(CASE WHEN r.status = 'Concluído' THEN 1 END) as requisitos_concluidos,
        COUNT(CASE WHEN r.status = 'Em desenvolvimento' THEN 1 END) as requisitos_desenvolvimento,
        COUNT(CASE WHEN r.status = 'Em análise' THEN 1 END) as requisitos_analise,
        COUNT(CASE WHEN r.tipo = 'Funcional' THEN 1 END) as requisitos_funcionais,
        COUNT(CASE WHEN r.tipo = 'Não Funcional' THEN 1 END) as requisitos_nao_funcionais
      FROM requisito r
      WHERE r.projeto_id = $1
    ),
    commits_summary AS (
      -- Resumo de commits
      SELECT 
        COUNT(*) as total_commits,
        MIN(c.data_commit) as primeiro_commit,
        MAX(c.data_commit) as ultimo_commit,
        COUNT(DISTINCT c.usuario_id) as contribuidores_unicos
      FROM commit c
      WHERE c.projeto_id = $1
    ),
    recent_commits AS (
      -- Commits recentes (últimos 10)
      SELECT 
        c.commit_id,
        c.hash_commit,
        c.mensagem,
        c.data_commit,
        c.url_commit,
        u.nome_usuario
      FROM commit c
      INNER JOIN usuario u ON c.usuario_id = u.usuario_id
      WHERE c.projeto_id = $1
      ORDER BY c.data_commit DESC
      LIMIT 10
    ),
    documents_summary AS (
      -- Documentos do projeto
      SELECT 
        COUNT(*) as total_documentos,
        COALESCE(SUM(d.tamanho_arquivo), 0) as tamanho_total_bytes,
        COUNT(DISTINCT d.tipo_arquivo) as tipos_arquivo_diferentes
      FROM documento d
      WHERE d.projeto_id = $1
    ),
    recent_documents AS (
      -- Documentos recentes
      SELECT 
        d.documento_id,
        d.nome_arquivo,
        d.tipo_arquivo,
        d.tamanho_arquivo,
        d.criado_em
      FROM documento d
      WHERE d.projeto_id = $1
      ORDER BY d.criado_em DESC
      LIMIT 5
    ),
    sprints_summary AS (
      -- Sprints do projeto
      SELECT 
        COUNT(*) as total_sprints,
        COALESCE(SUM(s.story_points), 0) as total_story_points_sprints,
        AVG(s.dias_sprint) as media_dias_sprint,
        MIN(s.data_inicio) as primeira_sprint,
        MAX(s.data_fim) as ultima_sprint
      FROM sprint s
      WHERE s.projeto_id = $1
    ),
    current_sprint_tasks AS (
      -- Tarefas da sprint atual
      SELECT 
        COUNT(*) as tarefas_sprint_atual,
        COALESCE(SUM(t.story_points), 0) as story_points_sprint_atual,
        COUNT(CASE WHEN t.status = 'Concluída' THEN 1 END) as tarefas_concluidas_sprint_atual
      FROM tarefa t
      INNER JOIN projeto p ON t.projeto_id = p.projeto_id
      WHERE t.projeto_id = $1 AND t.sprint_id = p.sprint_selecionada_id
    ),
    messages_summary AS (
      -- Mensagens do projeto
      SELECT 
        COUNT(*) as total_mensagens,
        COUNT(DISTINCT m.usuario_id) as usuarios_ativos_chat,
        MIN(m.criado_em) as primeira_mensagem,
        MAX(m.criado_em) as ultima_mensagem
      FROM mensagem m
      WHERE m.projeto_id = $1
    ),
    task_history_summary AS (
      -- Histórico de alterações de tarefas
      SELECT 
        COUNT(*) as total_alteracoes_tarefas,
        COUNT(DISTINCT ht.tarefa_id) as tarefas_com_historico,
        COUNT(DISTINCT ht.usuario_id) as usuarios_alteracoes
      FROM historico_tarefa ht
      INNER JOIN tarefa t ON ht.tarefa_id = t.tarefa_id
      WHERE t.projeto_id = $1
    ),
    requirement_history_summary AS (
      -- Histórico de alterações de requisitos
      SELECT 
        COUNT(*) as total_alteracoes_requisitos,
        COUNT(DISTINCT hr.requisito_id) as requisitos_com_historico
      FROM historico_requisito hr
      INNER JOIN requisito r ON hr.requisito_id = r.requisito_id
      WHERE r.projeto_id = $1
    )

    SELECT 
      -- Dados do projeto
      (SELECT row_to_json(pd) FROM project_data pd) as projeto,
      
      -- Equipe
      (SELECT json_agg(row_to_json(tm)) FROM team_members tm) as equipe,
      
      -- Resumos gerais
      (SELECT row_to_json(ts) FROM tasks_summary ts) as resumo_tarefas,
      (SELECT row_to_json(rs) FROM requirements_summary rs) as resumo_requisitos,
      (SELECT row_to_json(cs) FROM commits_summary cs) as resumo_commits,
      (SELECT row_to_json(ds) FROM documents_summary ds) as resumo_documentos,
      (SELECT row_to_json(ss) FROM sprints_summary ss) as resumo_sprints,
      (SELECT row_to_json(cst) FROM current_sprint_tasks cst) as sprint_atual,
      (SELECT row_to_json(ms) FROM messages_summary ms) as resumo_mensagens,
      (SELECT row_to_json(ths) FROM task_history_summary ths) as historico_tarefas,
      (SELECT row_to_json(rhs) FROM requirement_history_summary rhs) as historico_requisitos,
      
      -- Dados detalhados
      (SELECT json_agg(row_to_json(tbp)) FROM tasks_by_priority tbp) as tarefas_por_prioridade,
      (SELECT json_agg(row_to_json(tbs)) FROM tasks_by_status tbs) as tarefas_por_status,
      (SELECT json_agg(row_to_json(rc)) FROM recent_commits rc) as commits_recentes,
      (SELECT json_agg(row_to_json(rd)) FROM recent_documents rd) as documentos_recentes
  `;

  try {
    const result = await pool.query(query, [projectId]);

    if (result.rows.length === 0) {
      throw new Error("Projeto não encontrado");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Erro ao gerar relatório do projeto:", error);
    throw error;
  }
}

async function getProjectMetrics(projectId) {
  // ✅ Adiciona verificação inicial para projectId
  if (!projectId) {
      console.warn("getProjectMetrics chamado sem projectId válido.");
      // Retorna um objeto com valores padrão ou nulos para evitar erros
      return {
          velocidade: { velocidade_media: 0, velocidade_minima: 0, velocidade_maxima: 0, sprints_analisadas: 0 },
          tempos_entrega: { lead_time_medio_dias: null, cycle_time_medio_dias: null, lead_time_mediano_dias: null, cycle_time_mediano_dias: null, total_tarefas_medidas: 0 },
          taxas_conclusao: { taxa_conclusao_tarefas: 0, taxa_conclusao_requisitos: 0, tarefas_entregues_no_prazo: 0 },
          qualidade: { tarefas_reabertas: 0, commits_por_tarefa: 0 },
          distribuicao_trabalho: { membros_com_tarefas: 0, total_membros_equipe: 0, media_tarefas_por_membro: 0, max_tarefas_por_membro: 0 },
          sprints_concluidas: [],
          throughput_semanal: []
      };
  }

  const query = `
    WITH completed_sprints AS (
      -- ✅ CORRIGIDO: Usa fase_tarefa = 'Feito' para SPs concluídos
      SELECT
        s.sprint_id,
        s.nome,
        s.story_points as story_points_planejados,
        COALESCE(SUM(t.story_points), 0) as story_points_concluidos,
        s.data_inicio,
        s.data_fim
      FROM sprint s
      LEFT JOIN tarefa t ON s.sprint_id = t.sprint_id AND t.fase_tarefa = 'Feito' -- Corrigido aqui
      WHERE s.projeto_id = $1 AND s.data_fim < NOW()
      GROUP BY s.sprint_id, s.nome, s.story_points, s.data_inicio, s.data_fim
    ),
    weekly_throughput AS (
      -- ✅ CORRIGIDO: Usa fase_tarefa = 'Feito'
      SELECT
        DATE_TRUNC('week', data_fim_real) as semana,
        COUNT(*) as tarefas_concluidas,
        COALESCE(SUM(story_points), 0) as story_points_concluidos
      FROM tarefa
      WHERE projeto_id = $1
        AND fase_tarefa = 'Feito' -- Corrigido aqui
        AND data_fim_real IS NOT NULL
      GROUP BY DATE_TRUNC('week', data_fim_real)
      ORDER BY semana DESC
      LIMIT 8
    ),
    lead_time_metrics AS (
       -- ✅ CORRIGIDO: Usa fase_tarefa = 'Feito' E calcula cycle time diretamente
      SELECT
        AVG(EXTRACT(EPOCH FROM (data_fim_real - data_criacao))/86400) as lead_time_medio_dias,
        -- Calcula cycle time aqui
        AVG(EXTRACT(EPOCH FROM (data_fim_real - data_inicio_real))/86400) as cycle_time_medio_dias,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (data_fim_real - data_criacao))/86400) as lead_time_mediano_dias,
        -- Calcula cycle time mediano aqui
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (data_fim_real - data_inicio_real))/86400) as cycle_time_mediano_dias,
        COUNT(*) as total_tarefas_medidas
      FROM tarefa
      WHERE projeto_id = $1
        AND fase_tarefa = 'Feito' -- Corrigido aqui
        AND data_fim_real IS NOT NULL
        AND data_criacao IS NOT NULL
        AND data_inicio_real IS NOT NULL -- Necessário para cycle time
    ),
    team_velocity AS (
      -- Velocidade da equipe (já usa completed_sprints, que foi corrigido)
      SELECT
        COALESCE(AVG(story_points_concluidos), 0) as velocidade_media,
        COALESCE(MIN(story_points_concluidos), 0) as velocidade_minima,
        COALESCE(MAX(story_points_concluidos), 0) as velocidade_maxima,
        COUNT(*) as sprints_analisadas
      FROM completed_sprints
    ),
    completion_rates AS (
      -- Taxas de conclusão
      SELECT
        -- ✅ CORRIGIDO: Taxa de conclusão de tarefas usa fase_tarefa = 'Feito'
        (SELECT
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE fase_tarefa = 'Feito'))::numeric / COUNT(*) -- Corrigido aqui
          END
         FROM tarefa WHERE projeto_id = $1) as taxa_conclusao_tarefas,

        -- ✅ CORRIGIDO: Taxa de conclusão de requisitos usa status = 'Finalizado'
        (SELECT
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE status = 'Finalizado'))::numeric / COUNT(*) -- Corrigido aqui
          END
         FROM requisito WHERE projeto_id = $1) as taxa_conclusao_requisitos,

        -- ✅ CORRIGIDO: Taxa de entrega no prazo usa fase_tarefa = 'Feito'
        (SELECT
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE data_entrega >= data_fim_real))::numeric / COUNT(*)
          END
         FROM tarefa
         WHERE projeto_id = $1
           AND fase_tarefa = 'Feito' -- Corrigido aqui
           AND data_entrega IS NOT NULL
           AND data_fim_real IS NOT NULL) as tarefas_entregues_no_prazo
    ),
    quality_metrics AS (
       -- Métricas de qualidade
       -- ⚠️ ATENÇÃO: A lógica de 'tarefas_reabertas' pode precisar de ajuste
       -- dependendo de como você loga as mudanças de FASE no histórico.
       -- Esta versão assume que o histórico loga a MUDANÇA DE FASE
       -- (valor_anterior='Feito', valor_novo!='Feito').
       SELECT
        (SELECT COUNT(DISTINCT ht.tarefa_id)
         FROM historico_tarefa ht
         INNER JOIN tarefa t ON ht.tarefa_id = t.tarefa_id
         WHERE t.projeto_id = $1
           AND ht.campo_alterado = 'fase_tarefa' -- Verifica se o histórico loga a fase
           AND ht.valor_anterior = 'Feito'       -- Se a fase anterior era 'Feito'
           AND ht.valor_novo != 'Feito') as tarefas_reabertas, -- E a nova não é 'Feito'

        -- Commits por tarefa (mantido igual, verificar se faz sentido)
        (SELECT
          CASE
            WHEN COUNT(DISTINCT t.tarefa_id) = 0 THEN 0
            ELSE COUNT(c.commit_id)::numeric / COUNT(DISTINCT t.tarefa_id) -- Corrigido para contar commit_id
          END
         FROM commit c
         INNER JOIN tarefa t ON c.projeto_id = t.projeto_id -- Assume commit ligado ao projeto, não tarefa
         WHERE t.projeto_id = $1) as commits_por_tarefa
    ),
    workload_distribution AS (
      -- Distribuição de carga de trabalho (mantido igual)
      SELECT
        COUNT(DISTINCT responsavel_id) as membros_com_tarefas,
        (SELECT COUNT(DISTINCT up.usuario_id) FROM usuario_projeto up -- Corrigido para contar usuários distintos no projeto
         WHERE up.projeto_id = $1) as total_membros_equipe,
        AVG(tarefas_por_membro) as media_tarefas_por_membro,
        MAX(tarefas_por_membro) as max_tarefas_por_membro
      FROM (
        SELECT responsavel_id, COUNT(*) as tarefas_por_membro
        FROM tarefa
        WHERE projeto_id = $1 AND responsavel_id IS NOT NULL
        GROUP BY responsavel_id
      ) subquery
    )

    SELECT
      (SELECT row_to_json(tv) FROM team_velocity tv) as velocidade,
      (SELECT row_to_json(ltm) FROM lead_time_metrics ltm) as tempos_entrega,
      (SELECT row_to_json(cr) FROM completion_rates cr) as taxas_conclusao,
      (SELECT row_to_json(qm) FROM quality_metrics qm) as qualidade,
      (SELECT row_to_json(wd) FROM workload_distribution wd) as distribuicao_trabalho,
      (SELECT json_agg(row_to_json(cs)) FROM completed_sprints cs) as sprints_concluidas,
      (SELECT json_agg(row_to_json(wt)) FROM weekly_throughput wt) as throughput_semanal
  `;

  try {
    const result = await pool.query(query, [projectId]);

    if (result.rows.length === 0) {
      console.warn(`Nenhum resultado encontrado para métricas do projeto ${projectId}`);
      // Retorna objeto com valores padrão/nulos para evitar erros no controller
       return {
          velocidade: { velocidade_media: 0, velocidade_minima: 0, velocidade_maxima: 0, sprints_analisadas: 0 },
          tempos_entrega: { lead_time_medio_dias: null, cycle_time_medio_dias: null, lead_time_mediano_dias: null, cycle_time_mediano_dias: null, total_tarefas_medidas: 0 },
          taxas_conclusao: { taxa_conclusao_tarefas: 0, taxa_conclusao_requisitos: 0, tarefas_entregues_no_prazo: 0 },
          qualidade: { tarefas_reabertas: 0, commits_por_tarefa: 0 },
          distribuicao_trabalho: { membros_com_tarefas: 0, total_membros_equipe: 0, media_tarefas_por_membro: 0, max_tarefas_por_membro: 0 },
          sprints_concluidas: [],
          throughput_semanal: []
       };
    }
    console.log(`Métricas calculadas para o projeto ${projectId}:`, result.rows[0]); // Log para depuração
    return result.rows[0];
  } catch (error) {
    console.error("Erro ao obter métricas do projeto:", error);
    throw error; // Re-lança o erro para o controller lidar
  }
}

module.exports = {
  getAllProjects,
  getProjectsById,
  createProjectWithTeams,
  updateProject,
  deleteProjectById,
  getProjectsByUser,
  getProjectById,
  fetchProjectUsers,
  getCommitsByRepo,
  getProjectCycleTime,
  getProjectReport,
  getProjectMetrics,
};
