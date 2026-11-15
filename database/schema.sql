-- ============================================================
-- SCRIPT SQL DE CRIAÇÃO DO BANCO DE DADOS (DDL)
-- SISTEMA WEB DE GESTÃO PARA OFICINA MECÂNICA
-- Autor: Ronnald da Silva Viana Peixoto & Grupo
-- ============================================================

CREATE DATABASE IF NOT EXISTS oficina_mecanica_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oficina_mecanica_db;

-- 1. Tabela de Usuários (Administradores e Clientes)
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    perfil ENUM('Administrador', 'Cliente') NOT NULL,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Veículos
CREATE TABLE veiculo (
    id_veiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    ano INT NOT NULL,
    cor VARCHAR(30),
    quilometragem INT DEFAULT 0,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario)
);

-- 3. Tabela de Catálogo de Serviços
CREATE TABLE servico (
    id_servico INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_base DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(50),
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo'
);

-- 4. Tabela de Peças e Estoque
CREATE TABLE peca (
    id_peca INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_unitario DECIMAL(10,2) NOT NULL,
    quantidade_estoque INT NOT NULL DEFAULT 0,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo'
);

-- 5. Tabela de Agendamentos
CREATE TABLE agendamento (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_veiculo INT NOT NULL,
    data_agendamento DATE NOT NULL,
    horario_agendamento TIME NOT NULL,
    status ENUM('Solicitado', 'Confirmado', 'Em andamento', 'Concluido', 'Cancelado') DEFAULT 'Solicitado',
    observacoes TEXT,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_veiculo) REFERENCES veiculo(id_veiculo)
);

-- 6. Tabela Associativa: Agendamento <-> Serviço
CREATE TABLE agendamento_servico (
    id_agendamento INT NOT NULL,
    id_servico INT NOT NULL,
    PRIMARY KEY (id_agendamento, id_servico),
    FOREIGN KEY (id_agendamento) REFERENCES agendamento(id_agendamento) ON DELETE CASCADE,
    FOREIGN KEY (id_servico) REFERENCES servico(id_servico)
);

-- 7. Tabela de Orçamentos
CREATE TABLE orcamento (
    id_orcamento INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_veiculo INT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('Pendente', 'Aprovado', 'Rejeitado', 'Cancelado') DEFAULT 'Pendente',
    observacoes TEXT,
    FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_veiculo) REFERENCES veiculo(id_veiculo)
);

-- 8. Tabela Associativa: Orçamento <-> Serviço
CREATE TABLE orcamento_servico (
    id_orcamento INT NOT NULL,
    id_servico INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_orcamento, id_servico),
    FOREIGN KEY (id_orcamento) REFERENCES orcamento(id_orcamento) ON DELETE CASCADE,
    FOREIGN KEY (id_servico) REFERENCES servico(id_servico)
);

-- 9. Tabela Associativa: Orçamento <-> Peça
CREATE TABLE orcamento_peca (
    id_orcamento INT NOT NULL,
    id_peca INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_orcamento, id_peca),
    FOREIGN KEY (id_orcamento) REFERENCES orcamento(id_orcamento) ON DELETE CASCADE,
    FOREIGN KEY (id_peca) REFERENCES peca(id_peca)
);

-- 10. Tabela de Ordens de Serviço (OS)
CREATE TABLE ordem_servico (
    id_ordem_servico INT AUTO_INCREMENT PRIMARY KEY,
    id_orcamento INT NULL,
    id_cliente INT NOT NULL,
    id_veiculo INT NOT NULL,
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_conclusao DATETIME NULL,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('Aberta', 'Em andamento', 'Aguardando peca', 'Concluida', 'Cancelada') DEFAULT 'Aberta',
    observacoes TEXT,
    FOREIGN KEY (id_orcamento) REFERENCES orcamento(id_orcamento),
    FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_veiculo) REFERENCES veiculo(id_veiculo)
);

-- 11. Tabela Associativa: Ordem de Serviço <-> Serviço Executado
CREATE TABLE ordem_servico_servico (
    id_ordem_servico INT NOT NULL,
    id_servico INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_ordem_servico, id_servico),
    FOREIGN KEY (id_ordem_servico) REFERENCES ordem_servico(id_ordem_servico) ON DELETE CASCADE,
    FOREIGN KEY (id_servico) REFERENCES servico(id_servico)
);

-- 12. Tabela Associativa: Ordem de Serviço <-> Peça Utilizada
CREATE TABLE ordem_servico_peca (
    id_ordem_servico INT NOT NULL,
    id_peca INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_ordem_servico, id_peca),
    FOREIGN KEY (id_ordem_servico) REFERENCES ordem_servico(id_ordem_servico) ON DELETE CASCADE,
    FOREIGN KEY (id_peca) REFERENCES peca(id_peca)
);

-- 13. Tabela de Histórico Digital de Manutenção (Imutável)
CREATE TABLE historico_manutencao (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    id_veiculo INT NOT NULL,
    id_ordem_servico INT NOT NULL,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    descricao_servicos TEXT NOT NULL,
    pecas_utilizadas TEXT,
    valor_total DECIMAL(10,2) NOT NULL,
    quilometragem INT,
    status_conclusao VARCHAR(50) DEFAULT 'Concluído',
    observacoes TEXT,
    FOREIGN KEY (id_veiculo) REFERENCES veiculo(id_veiculo),
    FOREIGN KEY (id_ordem_servico) REFERENCES ordem_servico(id_ordem_servico)
);
