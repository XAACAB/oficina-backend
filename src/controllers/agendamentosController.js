const pool = require('../config/database');

// Listar agendamentos
async function listar(req, res) {
  try {
    const { id_cliente, status, data } = req.query;
    const isAdmin = req.usuario.perfil === 'Administrador';

    let sql = `
      SELECT a.*,
             u.nome AS nome_cliente,
             v.placa, v.modelo, v.marca
      FROM agendamento a
      JOIN usuario u ON u.id_usuario = a.id_cliente
      JOIN veiculo v ON v.id_veiculo = a.id_veiculo
      WHERE 1=1
    `;
    let params = [];

    // Cliente só vê os próprios
    if (!isAdmin) {
      sql += ' AND a.id_cliente = ?';
      params.push(req.usuario.id_usuario);
    } else if (id_cliente) {
      sql += ' AND a.id_cliente = ?';
      params.push(id_cliente);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (data) {
      sql += ' AND a.data_agendamento = ?';
      params.push(data);
    }

    sql += ' ORDER BY a.data_agendamento DESC, a.horario_agendamento DESC';

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar agendamentos.' });
  }
}

// Buscar por ID (com serviços)
async function buscarPorId(req, res) {
  try {
    const [agendamentos] = await pool.query(
      `SELECT a.*,
              u.nome AS nome_cliente,
              v.placa, v.modelo, v.marca
       FROM agendamento a
       JOIN usuario u ON u.id_usuario = a.id_cliente
       JOIN veiculo v ON v.id_veiculo = a.id_veiculo
       WHERE a.id_agendamento = ?`,
      [req.params.id]
    );

    if (agendamentos.length === 0) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    const [servicos] = await pool.query(
      `SELECT s.id_servico, s.nome, s.valor_base, s.categoria
       FROM agendamento_servico ags
       JOIN servico s ON s.id_servico = ags.id_servico
       WHERE ags.id_agendamento = ?`,
      [req.params.id]
    );

    return res.json({
      ...agendamentos[0],
      servicos
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar agendamento.' });
  }
}

// Criar agendamento
async function criar(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id_cliente, id_veiculo, data_agendamento, horario_agendamento, observacoes, servicos } = req.body;
    const isAdmin = req.usuario.perfil === 'Administrador';

    // Se for cliente, só pode agendar para si
    const clienteId = isAdmin ? id_cliente : req.usuario.id_usuario;

    if (!clienteId || !id_veiculo || !data_agendamento || !horario_agendamento) {
      await connection.rollback();
      return res.status(400).json({
        erro: 'id_cliente, id_veiculo, data_agendamento e horario_agendamento são obrigatórios.'
      });
    }

    // Verifica se o horário já está ocupado
    const [ocupado] = await connection.query(
      `SELECT id_agendamento FROM agendamento
       WHERE data_agendamento = ?
         AND horario_agendamento = ?
         AND status NOT IN ('Cancelado')`,
      [data_agendamento, horario_agendamento]
    );

    if (ocupado.length > 0) {
      await connection.rollback();
      return res.status(400).json({ erro: 'Horário já ocupado.' });
    }

    // Verifica se o veículo pertence ao cliente
    const [veiculo] = await connection.query(
      `SELECT id_veiculo FROM veiculo
       WHERE id_veiculo = ? AND id_cliente = ? AND status = 'Ativo'`,
      [id_veiculo, clienteId]
    );

    if (veiculo.length === 0) {
      await connection.rollback();
      return res.status(400).json({ erro: 'Veículo não encontrado ou não pertence ao cliente.' });
    }

    const [result] = await connection.query(
      `INSERT INTO agendamento
       (id_cliente, id_veiculo, data_agendamento, horario_agendamento, observacoes, status)
       VALUES (?, ?, ?, ?, ?, 'Solicitado')`,
      [clienteId, id_veiculo, data_agendamento, horario_agendamento, observacoes || null]
    );

    const idAgendamento = result.insertId;

    // Vincula serviços (se enviados)
    if (servicos && Array.isArray(servicos) && servicos.length > 0) {
      for (const idServico of servicos) {
        await connection.query(
          `INSERT INTO agendamento_servico (id_agendamento, id_servico)
           VALUES (?, ?)`,
          [idAgendamento, idServico]
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      mensagem: 'Agendamento criado com sucesso.',
      id_agendamento: idAgendamento
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar agendamento.' });
  } finally {
    connection.release();
  }
}

// Atualizar status (confirmar, cancelar, etc.)
async function atualizarStatus(req, res) {
  try {
    const { status, observacoes } = req.body;
    const statusValidos = ['Solicitado', 'Confirmado', 'Em andamento', 'Concluido', 'Cancelado'];

    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({
        erro: 'Status inválido. Use: Solicitado, Confirmado, Em andamento, Concluido ou Cancelado.'
      });
    }

    // Só admin pode confirmar / mudar status livremente
    if (req.usuario.perfil !== 'Administrador') {
      // Cliente só pode cancelar o próprio
      if (status !== 'Cancelado') {
        return res.status(403).json({ erro: 'Cliente só pode cancelar o agendamento.' });
      }
    }

    await pool.query(
      `UPDATE agendamento
       SET status = ?, observacoes = COALESCE(?, observacoes)
       WHERE id_agendamento = ?`,
      [status, observacoes || null, req.params.id]
    );

    return res.json({ mensagem: 'Status do agendamento atualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar status do agendamento.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizarStatus };