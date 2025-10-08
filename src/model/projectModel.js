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
  const query = `
    SELECT DISTINCT
      p.*,
      COALESCE((
        SELECT COUNT(DISTINCT ue.usuario_id)
        FROM projeto_equipe pe
        LEFT JOIN usuario_equipe ue ON pe.equipe_id = ue.equipe_id
        WHERE pe.projeto_id = p.projeto_id
          AND ue.usuario_id != p.criador_id
      ), 0) + 1 AS total_membros -- +1 para incluir o criador
    FROM projeto p
    LEFT JOIN projeto_equipe pe ON p.projeto_id = pe.projeto_id
    LEFT JOIN usuario_equipe ue ON pe.equipe_id = ue.equipe_id
    WHERE p.criador_id = $1
       OR ue.usuario_id = $1
    ORDER BY p.criado_em DESC;
  `;
  const values = [usuario_id];

  try {
    const result = await pool.query(query, values);
    // console.log("Resultado da query getProjectsByUser:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Erro no model ao buscar projetos do usuário:", error);
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

module.exports = {
  getAllProjects,
  getProjectsById,
  createProjectWithTeams,
  updateProject,
  deleteProjectById,
  getProjectsByUser,
  getProjectById,
  fetchProjectUsers,
};
