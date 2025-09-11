const axios = require("axios");

exports.githubCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error("Erro do GitHub:", error);
    return res.redirect("http://localhost:5173/github-success"); // sem token = erro
  }

  if (!code) {
    console.error("Código de autorização não encontrado");
    return res.redirect("http://localhost:5173/github-success"); // sem token = erro
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error("Não foi possível obter o token");
      return res.redirect("http://localhost:5173/github-success"); // erro
    }

    console.log("Token obtido:", accessToken);
    return res.redirect(
      `http://localhost:5173/github-success-integration?github_token=${accessToken}`
    );
  } catch (err) {
    console.error("Erro ao trocar code por token:", err.message);
    return res.redirect("http://localhost:5173/github-success"); // erro
  }
};

exports.githubLogin = (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = "http://localhost:3000/api/auth/github/callback";

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo,user`;

  res.redirect(githubAuthUrl);
};

exports.getUserRepositories = async (req, res) => {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ message: "Token de acesso não fornecido" });
  }

  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar repositórios:", {
      message: error.message,
      responseData: error.response?.data,
      status: error.response?.status,
    });

    res.status(500).json({ message: "Erro ao buscar repositórios" });
  }
};

exports.postCommitFile = async (req, res) => {
  const { access_token, owner, repo, filePath, content, commitMessage } =
    req.body;

  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    const refRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`,
      { headers }
    );
    const latestCommitSha = refRes.data.object.sha;

    const commitRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      { headers }
    );
    const baseTreeSha = commitRes.data.tree.sha;

    const blobRes = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      {
        content: content,
        encoding: "utf-8",
      },
      { headers }
    );
    const blobSha = blobRes.data.sha;

    const treeRes = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        base_tree: baseTreeSha,
        tree: [
          {
            path: filePath,
            mode: "100644",
            type: "blob",
            sha: blobSha,
          },
        ],
      },
      { headers }
    );
    const newTreeSha = treeRes.data.sha;

    const newCommitRes = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      },
      { headers }
    );
    const newCommitSha = newCommitRes.data.sha;

    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
      {
        sha: newCommitSha,
      },
      { headers }
    );

    return res.json({
      message: "Commit realizado com sucesso",
      commitSha: newCommitSha,
    });
  } catch (error) {
    console.error(
      "Erro ao fazer commit:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      error: "Erro ao fazer commit",
      details: error.response?.data || error.message,
    });
  }
};

exports.postCreateRepo = async (req, res) => {
  const { access_token, name, description, isPrivate } = req.body;

  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    const response = await axios.post(
      "https://api.github.com/user/repos",
      {
        name: name,
        description: description || "",
        private: isPrivate || false,
      },
      { headers }
    );

    return res.status(201).json({
      message: "Repositório criado com sucesso!",
      repository: response.data,
    });
  } catch (error) {
    console.error(
      "Erro ao criar repositório:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      error: "Erro ao criar repositório",
      details: error.response?.data || error.message,
    });
  }
};

// {
//   "access_token": "gho_xxxxxxx",
//   "name": "meu-novo-repo",
//   "description": "Repositório criado via API",
//   "isPrivate": false
// }

exports.deleteRepo = async (req, res) => {
  const { access_token, owner, repoName } = req.body;

  if (!access_token || !owner || !repoName) {
    return res
      .status(400)
      .json({ message: "Parâmetros obrigatórios ausentes" });
  }

  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    await axios.delete(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers,
    });

    return res
      .status(200)
      .json({ message: `Repositório '${repoName}' deletado com sucesso.` });
  } catch (error) {
    console.error(
      "Erro ao deletar repositório:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Erro ao deletar repositório",
      details: error.response?.data || error.message,
    });
  }
};

// {
//   "access_token": "gho_xxxxxxxxxxxxx",
//   "owner": "seu-usuario",
//   "repoName": "nome-do-repositorio"
// }

exports.getRepoStatus = async (req, res) => {
  const { owner, repo } = req.params;
  const accessToken = req.headers.authorization?.split(" ")[1];

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    res.json({
      name: response.data.name,
      private: response.data.private,
      default_branch: response.data.default_branch,
      updated_at: response.data.updated_at,
      pushed_at: response.data.pushed_at,
      open_issues: response.data.open_issues_count,
      forks: response.data.forks,
      stargazers_count: response.data.stargazers_count,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar status do repositório:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Erro ao buscar status do repositório",
      error: error.response?.data || error.message,
    });
  }
};

// http://localhost:3000/api/repos/<OWNER>/<REPO>/status
