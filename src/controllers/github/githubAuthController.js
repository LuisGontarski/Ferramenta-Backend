const axios = require("axios");
const base64 = require("js-base64");

exports.githubCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização não encontrado");
  }

  try {
    // Troca o code por access_token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).send("Não foi possível obter o token de acesso");
    }

    console.log("Token de acesso obtido com sucesso:", accessToken);

    // Detecta se a requisição foi feita pelo navegador ou API
    const acceptHeader = req.headers.accept || "";
    const isApiRequest = acceptHeader.includes("application/json");

    if (isApiRequest) {
      // Retorna como JSON (ideal para Postman ou fetch do frontend)
      return res.json({ access_token: accessToken });
    } else {
      // Redireciona para o frontend com o token como parâmetro na URL
      return res.redirect(`http://localhost:5173?access_token=${accessToken}`);
    }
  } catch (error) {
    console.error("Erro ao trocar code por token:", error.message);
    return res.status(500).send("Erro interno no servidor");
  }
};

exports.githubLogin = (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    "https://ferramenta-backend.onrender.com/api/auth/github/callback";

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
  const { access_token, owner, repo, filePath, content, commitMessage } = req.body;

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

    return res.json({ message: "Commit realizado com sucesso", commitSha: newCommitSha });
  } catch (error) {
    console.error("Erro ao fazer commit:", error.response?.data || error.message);
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
    console.error("Erro ao criar repositório:", error.response?.data || error.message);
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
    return res.status(400).json({ message: "Parâmetros obrigatórios ausentes" });
  }

  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    await axios.delete(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers,
    });

    return res.status(200).json({ message: `Repositório '${repoName}' deletado com sucesso.` });
  } catch (error) {
    console.error("Erro ao deletar repositório:", error.response?.data || error.message);
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

exports.commitFile = async (req, res) => {
  const { access_token, owner, repo, path, content, message } = req.body;

  if (!access_token || !owner || !repo || !path || !content || !message) {
    return res.status(400).json({ message: "Parâmetros obrigatórios ausentes" });
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // Verificar se o arquivo já existe para obter o SHA
    let sha = null;
    try {
      const getFile = await axios.get(url, { headers });
      sha = getFile.data.sha;
    } catch (err) {
      // Se não existe, ignoramos o erro
    }

    const response = await axios.put(
      url,
      {
        message,
        content: base64.encode(content), // conteúdo em base64
        sha: sha || undefined,
      },
      { headers }
    );

    return res.status(200).json({ message: "Commit realizado com sucesso", data: response.data });
  } catch (error) {
    console.error("Erro ao fazer commit:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Erro ao fazer commit",
      details: error.response?.data || error.message,
    });
  }
};

// {
//   "access_token": "gho_xxxxxxxxxxx",
//   "owner": "seu-usuario",
//   "repo": "nome-do-repositorio",
//   "path": "meuarquivo.txt",
//   "content": "Olá, mundo!",
//   "message": "Adicionando meuarquivo.txt"
// }

