const axios = require("axios");

exports.githubCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização não encontrado");
  }

  try {
    // Troca o code pelo access_token
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

    // Redireciona o usuário para o frontend, com o token na URL
    res.redirect(`http://localhost:5173?access_token=${accessToken}`);
    console.log("Token de acesso obtido com sucesso:", accessToken);
  } catch (error) {
    console.error("Erro ao trocar code por token:", error.message);
    res.status(500).send("Erro interno no servidor");
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
