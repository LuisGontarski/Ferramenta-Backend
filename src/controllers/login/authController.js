const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createUser } = require("../../model/loginModel");
const { getUserByEmail } = require("../../model/loginModel");

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const senhaValida = user.senha;
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    if (senhaValida !== senha) {
      // Senha incorreta
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

exports.getUserById = (req, res) => {
  const { id } = req.params;

  if (id != fakeUser.id) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json({ id: fakeUser.id, email: fakeUser.email });
};

exports.create = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ message: "Nome, email e senha são obrigatórios." });
  }

  try {
    const novoUsuario = await createUser({ nome, email, senha });
    res
      .status(201)
      .json({ message: "Usuário registrado com sucesso!", id: novoUsuario.id });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
};

exports.update = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  res.status(200).json({ message: "Usuário atualizado com sucesso!" });
};

exports.delete = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do usuário é obrigatório" });
  }

  res.status(200).json({ message: "Usuário deletado com sucesso!" });
};
