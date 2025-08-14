const commitModel = require("../model/commitModel");

exports.getCommitById = async (req, res) => {
  const { id } = req.params;
  try {
    const commit = await commitModel.getCommitById(id);
    if (!commit) {
      return res.status(404).json({ message: "Commit não encontrado" });
    }
    res.status(200).json(commit);
  } catch (error) {
    console.error("Erro ao buscar commit:", error.message);
    res.status(500).json({ message: "Erro ao buscar commit" });
  }
};

exports.syncCommits = async (req, res) => {
  const { owner, repo, usuario_id, projeto_id, githubUsername } = req.body;

  if (!owner || !repo || !usuario_id || !projeto_id || !githubUsername) {
    return res
      .status(400)
      .json({ message: "Preencha todos os campos obrigatórios." });
  }

  try {
    let page = 1;
    const per_page = 100;
    let adicionados = 0;
    let existentes = 0;
    let totalCommits = 0;

    while (true) {
      // URL com filtro pelo autor
      const url = `https://api.github.com/repos/${owner}/${repo}/commits?author=${githubUsername}&per_page=${per_page}&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar commits do GitHub");

      const commitsGitHub = await response.json();
      if (commitsGitHub.length === 0) break;

      for (const c of commitsGitHub) {
        const result = await commitModel.insertCommit({
          usuario_id,
          projeto_id,
          hash_commit: c.sha,
          mensagem: c.commit.message,
          data_commit: c.commit.author.date,
          url_commit: c.html_url,
        });

        if (result) adicionados++;
        else existentes++;
        totalCommits++;
      }

      page++;
    }

    res.status(200).json({
      message: "Sincronização completa!",
      total_commits_processados: totalCommits,
      commits_adicionados: adicionados,
      commits_existentes: existentes,
    });
  } catch (error) {
    console.error("Erro ao sincronizar commits:", error.message);
    res.status(500).json({ message: "Erro ao sincronizar commits" });
  }
};
