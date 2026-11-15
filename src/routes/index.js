const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const clientesController = require('../controllers/clientesController');
const veiculosController = require('../controllers/veiculosController');
const servicosController = require('../controllers/servicosController');
const pecasController = require('../controllers/pecasController');
const agendamentosController = require('../controllers/agendamentosController');
const { autenticar, apenasAdmin } = require('../middlewares/auth');

// Auth
router.post('/auth/cadastrar', authController.cadastrar);
router.post('/auth/login', authController.login);

// Clientes
router.get('/clientes', autenticar, clientesController.listar);
router.get('/clientes/:id', autenticar, clientesController.buscarPorId);
router.post('/clientes', autenticar, apenasAdmin, clientesController.cadastrar);
router.put('/clientes/:id', autenticar, apenasAdmin, clientesController.atualizar);
router.delete('/clientes/:id', autenticar, apenasAdmin, clientesController.inativar);

// Veículos
router.get('/veiculos', autenticar, veiculosController.listar);
router.get('/veiculos/:id', autenticar, veiculosController.buscarPorId);
router.post('/veiculos', autenticar, apenasAdmin, veiculosController.cadastrar);
router.put('/veiculos/:id', autenticar, apenasAdmin, veiculosController.atualizar);
router.delete('/veiculos/:id', autenticar, apenasAdmin, veiculosController.inativar);

// Serviços
router.get('/servicos', autenticar, servicosController.listar);
router.get('/servicos/:id', autenticar, servicosController.buscarPorId);
router.post('/servicos', autenticar, apenasAdmin, servicosController.cadastrar);
router.put('/servicos/:id', autenticar, apenasAdmin, servicosController.atualizar);
router.delete('/servicos/:id', autenticar, apenasAdmin, servicosController.inativar);

// Peças
router.get('/pecas', autenticar, pecasController.listar);
router.get('/pecas/:id', autenticar, pecasController.buscarPorId);
router.post('/pecas', autenticar, apenasAdmin, pecasController.cadastrar);
router.put('/pecas/:id', autenticar, apenasAdmin, pecasController.atualizar);
router.put('/pecas/:id/estoque', autenticar, apenasAdmin, pecasController.entradaEstoque);
router.delete('/pecas/:id', autenticar, apenasAdmin, pecasController.inativar);

// Agendamentos
router.get('/agendamentos', autenticar, agendamentosController.listar);
router.get('/agendamentos/:id', autenticar, agendamentosController.buscarPorId);
router.post('/agendamentos', autenticar, agendamentosController.criar);
router.put('/agendamentos/:id/status', autenticar, agendamentosController.atualizarStatus);

module.exports = router;