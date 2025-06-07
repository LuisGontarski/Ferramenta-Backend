const axios = require("axios");

exports.githubCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização não encontrado");
  }

  try {
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

    res.json({ access_token: accessToken });
  } catch (error) {
    console.error("Erro ao trocar code por token:", error.message);
    res.status(500).send("Erro interno no servidor");
  }
};

exports.githubLogin = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    "https://ferramenta-backend.onrender.com/api/auth/github/callback";

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo,user`;

  res.redirect(githubAuthUrl);
};
