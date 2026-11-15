const pool = require('../config/database');

// Listar serviços
async function listar(req, res) {
  try {
    const { busca, categoria } = req.query;

    let sql = `SELECT * FROM servico WHERE status = 'Ativo'`;
    let params = [];

    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    if (busca) {
      sql += ' AND (nome LIKE ? OR descricao LIKE ?)';
      const termo = `%${busca}%`;
      params.push(termo, termo);
    }

    sql += ' ORDER BY nome';
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar serviços.' });
  }
}

// Buscar por ID
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM servico WHERE id_servico = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Serviço não encontrado.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar serviço.' });
  }
}

// Cadastrar serviço
async function cadastrar(req, res) {
  try {
    const { nome, descricao, valor_base, categoria } = req.body;

    if (!nome || valor_base === undefined) {
      return res.status(400).json({ erro: 'Nome e valor_base são obrigatórios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO servico (nome, descricao, valor_base, categoria)
       VALUES (?, ?, ?, ?)`,
      [nome, descricao || null, valor_base, categoria || null]
    );

    return res.status(201).json({
      mensagem: 'Serviço cadastrado com sucesso.',
      id_servico: result.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao cadastrar serviço.' });
  }
}

// Atualizar serviço
async function atualizar(req, res) {
  try {
    const { nome, descricao, valor_base, categoria, status } = req.body;

    await pool.query(
      `UPDATE servico
       SET nome = ?, descricao = ?, valor_base = ?, categoria = ?, status = ?
       WHERE id_servico = ?`,
      [nome, descricao, valor_base, categoria, status || 'Ativo', req.params.id]
    );

    return res.json({ mensagem: 'Serviço atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar serviço.' });
  }
}

// Inativar serviço
async function inativar(req, res) {
  try {
    await pool.query(
      `UPDATE servico SET status = 'Inativo' WHERE id_servico = ?`,
      [req.params.id]
    );

    return res.json({ mensagem: 'Serviço inativado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao inativar serviço.' });
  }
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, inativar };