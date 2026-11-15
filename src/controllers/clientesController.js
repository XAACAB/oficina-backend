const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Listar apenas clientes
async function listar(req, res) {
  try {
    const { busca } = req.query;
    let sql = `SELECT id_usuario, nome, email, telefone, cpf, status, data_cadastro
               FROM usuario
               WHERE perfil = 'Cliente' AND status = 'Ativo'`;
    let params = [];

    if (busca) {
      sql += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR cpf LIKE ?)';
      const termo = `%${busca}%`;
      params = [termo, termo, termo, termo];
    }

    sql += ' ORDER BY nome';
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar clientes.' });
  }
}

// Buscar cliente por ID
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario, nome, email, telefone, cpf, status, data_cadastro
       FROM usuario
       WHERE id_usuario = ? AND perfil = 'Cliente'`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar cliente.' });
  }
}

// Cadastrar cliente
async function cadastrar(req, res) {
  try {
    const { nome, email, senha, telefone, cpf } = req.body;

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

    const [result] = await pool.query(
      `INSERT INTO usuario (nome, email, senha, telefone, cpf, perfil)
       VALUES (?, ?, ?, ?, ?, 'Cliente')`,
      [nome, email, senhaHash, telefone || null, cpf || null]
    );

    return res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso.',
      id_usuario: result.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao cadastrar cliente.' });
  }
}

// Atualizar cliente
async function atualizar(req, res) {
  try {
    const { nome, telefone, cpf, status } = req.body;

    await pool.query(
      `UPDATE usuario
       SET nome = ?, telefone = ?, cpf = ?, status = ?
       WHERE id_usuario = ? AND perfil = 'Cliente'`,
      [nome, telefone, cpf, status || 'Ativo', req.params.id]
    );

    return res.json({ mensagem: 'Cliente atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar cliente.' });
  }
}

// Inativar cliente
async function inativar(req, res) {
  try {
    await pool.query(
      `UPDATE usuario SET status = 'Inativo'
       WHERE id_usuario = ? AND perfil = 'Cliente'`,
      [req.params.id]
    );

    return res.json({ mensagem: 'Cliente inativado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao inativar cliente.' });
  }
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, inativar };