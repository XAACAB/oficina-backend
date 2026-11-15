const pool = require('../config/database');

// Listar peças
async function listar(req, res) {
  try {
    const { busca } = req.query;

    let sql = `SELECT * FROM peca WHERE status = 'Ativo'`;
    let params = [];

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
    return res.status(500).json({ erro: 'Erro ao listar peças.' });
  }
}

// Buscar por ID
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM peca WHERE id_peca = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Peça não encontrada.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar peça.' });
  }
}

// Cadastrar peça
async function cadastrar(req, res) {
  try {
    const { nome, descricao, preco_unitario, quantidade_estoque } = req.body;

    if (!nome || preco_unitario === undefined) {
      return res.status(400).json({ erro: 'Nome e preco_unitario são obrigatórios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO peca (nome, descricao, preco_unitario, quantidade_estoque)
       VALUES (?, ?, ?, ?)`,
      [nome, descricao || null, preco_unitario, quantidade_estoque || 0]
    );

    return res.status(201).json({
      mensagem: 'Peça cadastrada com sucesso.',
      id_peca: result.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao cadastrar peça.' });
  }
}

// Atualizar peça
async function atualizar(req, res) {
  try {
    const { nome, descricao, preco_unitario, quantidade_estoque, status } = req.body;

    await pool.query(
      `UPDATE peca
       SET nome = ?, descricao = ?, preco_unitario = ?, quantidade_estoque = ?, status = ?
       WHERE id_peca = ?`,
      [nome, descricao, preco_unitario, quantidade_estoque, status || 'Ativo', req.params.id]
    );

    return res.json({ mensagem: 'Peça atualizada com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar peça.' });
  }
}

// Entrada de estoque (soma quantidade)
async function entradaEstoque(req, res) {
  try {
    const { quantidade } = req.body;

    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({ erro: 'Quantidade deve ser maior que zero.' });
    }

    await pool.query(
      `UPDATE peca
       SET quantidade_estoque = quantidade_estoque + ?
       WHERE id_peca = ? AND status = 'Ativo'`,
      [quantidade, req.params.id]
    );

    return res.json({ mensagem: 'Entrada de estoque registrada com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao registrar entrada de estoque.' });
  }
}

// Inativar peça
async function inativar(req, res) {
  try {
    await pool.query(
      `UPDATE peca SET status = 'Inativo' WHERE id_peca = ?`,
      [req.params.id]
    );

    return res.json({ mensagem: 'Peça inativada com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao inativar peça.' });
  }
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, entradaEstoque, inativar };