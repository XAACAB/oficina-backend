const pool = require('../config/database');

// Listar veículos
async function listar(req, res) {
  try {
    const { busca, id_cliente } = req.query;

    let sql = `
      SELECT v.*, u.nome AS nome_cliente
      FROM veiculo v
      JOIN usuario u ON u.id_usuario = v.id_cliente
      WHERE v.status = 'Ativo'
    `;
    let params = [];

    if (id_cliente) {
      sql += ' AND v.id_cliente = ?';
      params.push(id_cliente);
    }

    if (busca) {
      sql += ' AND (v.placa LIKE ? OR v.modelo LIKE ? OR v.marca LIKE ?)';
      const termo = `%${busca}%`;
      params.push(termo, termo, termo);
    }

    sql += ' ORDER BY v.placa';
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar veículos.' });
  }
}

// Buscar por ID
async function buscarPorId(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, u.nome AS nome_cliente
       FROM veiculo v
       JOIN usuario u ON u.id_usuario = v.id_cliente
       WHERE v.id_veiculo = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar veículo.' });
  }
}

// Cadastrar veículo
async function cadastrar(req, res) {
  try {
    const { id_cliente, placa, modelo, marca, ano, cor, quilometragem } = req.body;

    if (!id_cliente || !placa || !modelo || !marca || !ano) {
      return res.status(400).json({ erro: 'id_cliente, placa, modelo, marca e ano são obrigatórios.' });
    }

    // Verifica se a placa já existe
    const [existe] = await pool.query(
      'SELECT id_veiculo FROM veiculo WHERE placa = ?',
      [placa]
    );

    if (existe.length > 0) {
      return res.status(400).json({ erro: 'Placa já cadastrada.' });
    }

    // Verifica se o cliente existe
    const [cliente] = await pool.query(
      `SELECT id_usuario FROM usuario
       WHERE id_usuario = ? AND perfil = 'Cliente' AND status = 'Ativo'`,
      [id_cliente]
    );

    if (cliente.length === 0) {
      return res.status(400).json({ erro: 'Cliente não encontrado ou inativo.' });
    }

    const [result] = await pool.query(
      `INSERT INTO veiculo (id_cliente, placa, modelo, marca, ano, cor, quilometragem)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, placa, modelo, marca, ano, cor || null, quilometragem || 0]
    );

    return res.status(201).json({
      mensagem: 'Veículo cadastrado com sucesso.',
      id_veiculo: result.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao cadastrar veículo.' });
  }
}

// Atualizar veículo
async function atualizar(req, res) {
  try {
    const { modelo, marca, ano, cor, quilometragem, status } = req.body;

    await pool.query(
      `UPDATE veiculo
       SET modelo = ?, marca = ?, ano = ?, cor = ?, quilometragem = ?, status = ?
       WHERE id_veiculo = ?`,
      [modelo, marca, ano, cor, quilometragem, status || 'Ativo', req.params.id]
    );

    return res.json({ mensagem: 'Veículo atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar veículo.' });
  }
}

// Inativar veículo
async function inativar(req, res) {
  try {
    await pool.query(
      `UPDATE veiculo SET status = 'Inativo' WHERE id_veiculo = ?`,
      [req.params.id]
    );

    return res.json({ mensagem: 'Veículo inativado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao inativar veículo.' });
  }
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, inativar };