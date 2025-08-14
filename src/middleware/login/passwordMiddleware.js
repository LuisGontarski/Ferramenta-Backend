const bcrypt = require('bcrypt');

const passwordMiddleware = async (req, res, next) => {
  try {
    if (req.body.senha) {
      const saltRounds = 10; // custo da criptografia
      req.body.senha = await bcrypt.hash(req.body.senha, saltRounds);
    }
    next();
  } catch (err) {
    console.error("Erro ao criptografar senha:", err);
    return res.status(500).json({ message: "Erro interno ao processar senha." });
  }
};

module.exports = passwordMiddleware;