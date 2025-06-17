const jwt = require("jsonwebtoken");
const UserDTO = require("../../dtos/userDTO");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("../../model/loginModel");
const { getUserById } = require("../../model/loginModel");
const { createUser, emailExists } = require("../../model/loginModel");
const { updateUser } = require("../../model/loginModel");
const { deleteUser } = require("../../model/loginModel");
const { getAllUsers } = require("../../model/loginModel");
const formatDateToDDMMYYYY = require("../../utils/ft_dateUtils");
const ft_validator = require("../../utils/validatorUtils");

exports.getAllUsers = async (_req, res) => {
  try {
    const users = await getAllUsers();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Nenhum usuário encontrado." });
    }

    const usersDTO = users.map((user) => new UserDTO(user));
    const usersSemSenha = usersDTO.map(
      ({ senha, ...userSemSenha }) => userSemSenha
    );

    res.status(200).json(usersSemSenha);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

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
      { id: user.usuario_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token: token,
      usuario_id: user.usuario_id,
      cargo: user.cargo,
      github_token: user.github_token,
    });

    // console.log("Usuário logado com sucesso:", user.id);
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

exports.getUserById = async (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ message: "ID do usuário é obrigatório." });
  }

  try {
    // console.log("ID do usuário:", usuario_id);-
    const user = await getUserById(usuario_id);

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
  const errors = {};

  const nomeError = ft_validator.validateRequired(
    userDTO.nome_usuario,
    "Nome de usuário"
  );
  if (nomeError) {
    errors.nome_usuario = nomeError;
  }

  let emailValidationError = ft_validator.validateRequired(
    userDTO.email,
    "E-mail"
  );
  if (!emailValidationError) {
    emailValidationError = ft_validator.validateEmailFormatBasic(userDTO.email);
  }
  if (emailValidationError) {
    errors.email = emailValidationError;
  }

  let senhaValidationError = ft_validator.validateRequired(
    userDTO.senha,
    "Senha"
  );
  if (!senhaValidationError) {
    senhaValidationError = ft_validator.validatePasswordLength(
      userDTO.senha,
      6
    );
  }
  if (senhaValidationError) {
    errors.senha = senhaValidationError;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Dados inválidos.", errors });
  }

  try {
    const existe = await ft_validator.emailExists(userDTO.email);
    if (existe) {
      return res.status(409).json({ message: "Email já cadastrado." });
    }

    const newUser = await createUser({
      nome: userDTO.nome_usuario,
      email: userDTO.email,
      senha: userDTO.senha,
      cargo: userDTO.cargo,
      github: userDTO.github,
      foto_perfil: userDTO.foto_perfil,
      github_token: userDTO.github_token,
    });

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      usuario_id: newUser.usuario_id,
      github_token: newUser.github_token,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ message: "Erro interno ao registrar usuário." });
  }
};

exports.putUpdateUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID é obrigatório." });
  }

  const userDTO = new UserDTO({ usuario_id: id, ...req.body });

  if (!userDTO.isValid()) {
    return res.status(400).json({ message: "Dados inválidos." });
  }

  if (!userDTO.email.includes("@") || !userDTO.email.includes(".com")) {
    return res.status(400).json({ message: "Email inválido." });
  }

  if (userDTO.senha.length < 6) {
    return res
      .status(400)
      .json({ message: "A senha deve ter pelo menos 6 caracteres." });
  }

  if (userDTO.nome_usuario.trim() === "") {
    return res.status(400).json({ message: "Nome inválido." });
  }

  try {
    const userUpdated = await updateUser({
      id: userDTO.usuario_id,
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
