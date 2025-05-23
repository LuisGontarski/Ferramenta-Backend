const jwt = require("jsonwebtoken");
const UserDTO = require("../../dtos/userDTO");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("../../model/loginModel");
const {getUserById} = require("../../model/loginModel");
const { createUser, emailExists } = require("../../model/loginModel");
const { updateUser } = require("../../model/loginModel");
const { deleteUser } = require("../../model/loginModel");

exports.postAuthLogin = async (req, res) => {
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

exports.getUserById =  async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do usuário é obrigatório." });
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userDTO = new UserDTO(user);
    const { senha, ...userSemSenha } = userDTO;

    res.status(200).json(userSemSenha);
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


exports.postCreateUser = async (req, res) => {
  const userDTO = new UserDTO(req.body);

  if (!userDTO.isValid()) {
    return res.status(400).json({ message: "Dados inválidos." });
  }

  if (!userDTO.email.includes('@') || !userDTO.email.includes('.com')) {
    return res.status(400).json({ message: "Email inválido." });
  }

  if (userDTO.senha.length < 6) {
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
  }

  try {

    const existe = await emailExists(userDTO.email);
    if (existe) {
      return res.status(409).json({ message: "Email já cadastrado." });
    }

    const newUser = await createUser({
      nome: userDTO.nome_usuario,
      email: userDTO.email,
      senha: userDTO.senha
    });

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      id: newUser.usuario_id
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
};

exports.putUpdateUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID é obrigatório." });
  }

  const userDTO = new UserDTO({usuario_id: id, ...req.body});

  if (!userDTO.isValid()) {
    return res.status(400).json({ message: "Dados inválidos." });
  }

  if (!userDTO.email.includes('@') || !userDTO.email.includes('.com')) {
    return res.status(400).json({ message: "Email inválido." });
  }

  if (userDTO.senha.length < 6) {
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
  }

  if (userDTO.nome_usuario.trim() === '') {
    return res.status(400).json({ message: "Nome inválido." });
  }

  try {
    const userUpdated = await updateUser({
      id,
      nome: userDTO.nome_usuario,
      email: userDTO.email,
      senha: userDTO.senha,
      cargo: userDTO.cargo,
      github: userDTO.github,
      foto_perfil: userDTO.foto_perfil,
    });

    if (!userUpdated) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID do usuário é obrigatório." });
  }

  try {
    const userDeleted = await deleteUser(id);

    if (!userDeleted) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};
