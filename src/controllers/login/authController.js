const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const fakeUser = {
  id: 1,
  email: 'usuario@teste.com',
  senha: bcrypt.hashSync('senha123', 10) // senha "senha123"
};

exports.login = (req, res) => {
  const { email, senha } = req.body;

  if (email !== fakeUser.email || !bcrypt.compareSync(senha, fakeUser.senha)) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: fakeUser.id, email: fakeUser.email }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  res.json({ token });
};

exports.getUserById = (req, res) => {
  const { id } = req.params;

  if (id != fakeUser.id) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  res.json({ id: fakeUser.id, email: fakeUser.email });
}

exports.create = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  res.status(201).json({ message: 'Usuário registrado com sucesso!' });
};

exports.update = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
};

exports.delete = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  res.status(200).json({ message: 'Usuário deletado com sucesso!' });
}
