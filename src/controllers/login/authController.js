const jwt = require("jsonwebtoken");
const UserDTO = require("../../dtos/userDTO");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("../../model/loginModel");
const { getUserById } = require("../../model/loginModel");
const { createUser, emailExists } = require("../../model/loginModel");
const { updateUser } = require("../../model/loginModel");
const { deleteUser } = require("../../model/loginModel");
const { getAllUsers } = require("../../model/loginModel");
const { updateGithubUsername } = require("../../model/loginModel");
const { getGithubUsernameFromToken } = require("../../model/loginModel");
const formatDateToDDMMYYYY = require("../../utils/ft_dateUtils");
const { getUsuariosComGithub } = require("../../model/loginModel");
const ft_validator = require("../../utils/validatorUtils");

exports.checkUserGithubExists = async (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ message: "usuario_id é obrigatório." });
  }

  try {
    const user = await getUserById(usuario_id); // Função do model já existente

    const exists = !!user; // true se usuário existe, false caso contrário

    res.status(200).json({ exists });
  } catch (err) {
    console.error("Erro ao verificar existência do usuário:", err);
    res.status(500).json({ message: "Erro ao verificar usuário." });
  }
};

exports.updateUserGithub = async (req, res) => {
  const { usuario_id, github_token } = req.body;

  if (!usuario_id || !github_token) {
    return res
      .status(400)
      .json({ message: "usuario_id e github_token são obrigatórios." });
  }

  try {
    // Busca username no GitHub usando o token
    const githubUsername = await getGithubUsernameFromToken(github_token);

    // Atualiza token e username no banco
    const updatedUser = await updateGithubUsername(
      usuario_id,
      githubUsername,
      github_token
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({
      message: "GitHub integrado com sucesso!",
      usuario_id: updatedUser.usuario_id,
      github_token: updatedUser.github_token,
      github: updatedUser.github,
    });
  } catch (err) {
    console.error("Erro ao integrar GitHub:", err);
    res.status(500).json({ message: "Erro ao integrar GitHub." });
  }
};

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

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: user.usuario_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      token: token,
      usuario_id: user.usuario_id,
      cargo: user.cargo,
      github_token: user.github_token,
      usuario_nome: user.nome_usuario,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

exports.getUserById = async (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ message: "ID do usuário é obrigatório." });
  }

  try {
    // Busca usuário no banco
    const user = await getUserById(usuario_id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Atualiza github se houver token
    if (user.github_token) {
      try {
        const githubUsername = await getGithubUsernameFromToken(
          user.github_token
        );
        if (githubUsername && githubUsername !== user.github) {
          await updateGithubUsername(usuario_id, githubUsername);
          user.github = githubUsername; // atualiza no objeto retornado
        }
      } catch (err) {
        console.error("Erro ao buscar GitHub username:", err.message);
        // Não impede resposta ao front
      }
    }

    const userDTO = new UserDTO(user);
    const { senha, github_token, ...userSemSenha } = userDTO;

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

    // ✅ NOVO: busca username se o token vier do GitHub
    let githubUsername = null;
    if (userDTO.github_token) {
      githubUsername = await getGithubUsernameFromToken(userDTO.github_token);
    }

    const newUser = await createUser({
      nome: userDTO.nome_usuario,
      email: userDTO.email,
      senha: userDTO.senha,
      cargo: userDTO.cargo,
      github: githubUsername, 
      foto_perfil: userDTO.foto_perfil,
      github_token: userDTO.github_token,
    });

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      usuario_id: newUser.usuario_id,
      github_token: newUser.github_token,
      github: githubUsername,
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

  // Apenas permite nome e email
  const { nome_usuario, email } = req.body;

  // Validações básicas
  if (!nome_usuario || nome_usuario.trim() === "") {
    return res.status(400).json({ message: "Nome é obrigatório." });
  }

  if (!email || !email.includes("@") || !email.includes(".com")) {
    return res.status(400).json({ message: "Email inválido." });
  }

  try {
    const userUpdated = await updateUser({
      id: id,
      nome: nome_usuario,
      email: email,
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

exports.getUsuariosComGithub = async (req, res) => {
  try {
    const search = req.query.search || ""; // pega o termo da pesquisa
    const usuarios = await getUsuariosComGithub(search);
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

exports.getUserRepos = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (!user.github || !user.github_token) {
      return res
        .status(400)
        .json({ message: "Usuário não possui GitHub vinculado." });
    }

    // Faz a requisição à API do GitHub
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${user.github_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        message: "Erro ao buscar repositórios no GitHub.",
        details: errorData,
      });
    }

    const repos = await response.json();

    // --- ALTERAÇÃO AQUI ---
    // 1. Filtra para incluir apenas os repositórios do próprio usuário
    const reposDoUsuario = repos.filter(
      (repo) => repo.owner.login === user.github
    );

    // 2. Mapeia apenas as informações relevantes dos repositórios filtrados
    const filteredRepos = reposDoUsuario.map((repo) => ({
      name: repo.name,
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      updated_at: repo.updated_at,
    }));

    return res.json(filteredRepos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};
