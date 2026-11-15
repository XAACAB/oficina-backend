const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function apenasAdmin(req, res, next) {
  if (req.usuario.perfil !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso permitido apenas para administradores.' });
  }
  next();
}

module.exports = { autenticar, apenasAdmin };