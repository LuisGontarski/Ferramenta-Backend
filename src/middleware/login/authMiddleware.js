module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token ausente' });

  if (token !== 'meu-token-fake') return res.status(403).json({ message: 'Token inválido' });

  next();
};
