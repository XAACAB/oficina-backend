const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function cadastrar(req, res) {
  try {
    const { nome, email, senha, telefone, cpf, perfil } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const [existe] = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = ?',
      [email]
    );

    if (existe.length > 0) {
      return res.status(400).json({ erro: 'E-mail já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const tipoPerfil = perfil === 'Administrador' ? 'Administrador' : 'Cliente';

    const [result] = await pool.query(
      `INSERT INTO usuario (nome, email, senha, telefone, cpf, perfil)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, email, senhaHash, telefone || null, cpf || null, tipoPerfil]
    );

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      id_usuario: result.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM usuario WHERE email = ? AND status = "Ativo"',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha);

    if (!senhaOk) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao realizar login.' });
  }
}

module.exports = { cadastrar, login };