const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const fakeUser = {
  id: 1,
  email: 'usuario@teste.com',
  passwordHash: bcrypt.hashSync('senha123', 10) // senha "senha123"
};

exports.login = (req, res) => {
  const { email, senha } = req.body;

  if (email !== fakeUser.email || !bcrypt.compareSync(senha, fakeUser.passwordHash)) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: fakeUser.id, email: fakeUser.email }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  res.json({ token });
};
