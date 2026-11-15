# API Oficina Mecânica

Backend REST para gestão de uma oficina mecânica, desenvolvido em Node.js, Express e MySQL. A API administra usuários, clientes, veículos, serviços, peças/estoque e agendamentos.

## Requisitos

- Node.js e npm instalados.
- MySQL em execução.
- MySQL Server e, opcionalmente, MySQL Workbench. O script do projeto cria o banco `oficina_mecanica_db` e as tabelas necessárias.

> O schema está em `database/schema.sql`. Execute-o antes de iniciar a API; as instruções estão na seção [Banco de dados para testes locais](#banco-de-dados-para-testes-locais).

## Instalação e execução

1. Clone o repositório e entre na pasta:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd oficina-backend
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz do projeto:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=oficina_mecanica_db
   JWT_SECRET=use_uma_chave_secreta_forte
   ```

   `PORT` é opcional (padrão `3000`). A conexão usa os valores de banco acima como padrão, exceto `JWT_SECRET`, que deve ser definido para assinar e validar tokens. Não compartilhe nem versione seu `.env`.

4. Inicie em desenvolvimento ou produção:

   ```bash
   npm run dev
   ```

   Ou:

   ```bash
   npm start
   ```

A API ficará disponível em `http://localhost:3000`. `GET /` retorna `{"mensagem":"API Oficina - Online"}`. As rotas funcionais usam o prefixo `/api`.

## Autenticação

Faça login em `POST /api/auth/login` e envie o token JWT retornado nas rotas protegidas:

```http
Authorization: Bearer <TOKEN>
```

As rotas de cadastro e login são públicas. As demais exigem token. As operações de escrita administrativa (cadastro, edição e inativação de clientes, veículos, serviços e peças, além de entrada de estoque) exigem perfil `Administrador`. Clientes podem consultar os dados permitidos e criar/cancelar os próprios agendamentos conforme as regras da API.

## Endpoints

Corpos e respostas usam JSON. `{id}` representa o identificador do registro. Exceto onde indicado, endpoints abaixo de `/api` exigem `Authorization: Bearer <TOKEN>`.

### Saúde

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/` | Público | Verifica se a API está online. |

### Autenticação

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| POST | `/api/auth/cadastrar` | Público | Cria usuário. Campos obrigatórios: `nome`, `email`, `senha`. Opcionais: `telefone`, `cpf`, `perfil`. O perfil só será `Administrador` se enviado exatamente como `Administrador`; caso contrário, será `Cliente`. |
| POST | `/api/auth/login` | Público | Autentica com `email` e `senha`; retorna token JWT válido por 8 horas e dados básicos do usuário. |

Exemplo de login:

```json
{"email":"cliente@exemplo.com","senha":"sua_senha"}
```

> Atenção: o endpoint público de cadastro aceita `perfil: "Administrador"`. Em implantação acessível a terceiros, restrinja esse comportamento para impedir que qualquer pessoa crie uma conta administrativa.

### Clientes

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/api/clientes?busca=termo` | Autenticado | Lista clientes ativos; `busca` filtra nome, e-mail, telefone ou CPF. |
| GET | `/api/clientes/{id}` | Autenticado | Busca cliente pelo ID. |
| POST | `/api/clientes` | Administrador | Cria cliente; requer `nome`, `email`, `senha`; aceita `telefone`, `cpf`. |
| PUT | `/api/clientes/{id}` | Administrador | Atualiza `nome`, `telefone`, `cpf` e `status`. |
| DELETE | `/api/clientes/{id}` | Administrador | Inativa o cliente (não apaga o registro). |

### Veículos

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/api/veiculos?busca=termo&id_cliente=1` | Autenticado | Lista veículos ativos; filtros opcionais por placa/modelo/marca e cliente. |
| GET | `/api/veiculos/{id}` | Autenticado | Busca veículo pelo ID. |
| POST | `/api/veiculos` | Administrador | Cadastra veículo. Requer `id_cliente`, `placa`, `modelo`, `marca`, `ano`; aceita `cor`, `quilometragem`. |
| PUT | `/api/veiculos/{id}` | Administrador | Atualiza `modelo`, `marca`, `ano`, `cor`, `quilometragem` e `status`. |
| DELETE | `/api/veiculos/{id}` | Administrador | Inativa o veículo. |

### Serviços

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/api/servicos?busca=termo&categoria=freio` | Autenticado | Lista serviços ativos; filtros opcionais por texto e categoria. |
| GET | `/api/servicos/{id}` | Autenticado | Busca serviço pelo ID. |
| POST | `/api/servicos` | Administrador | Cadastra serviço. Requer `nome`, `valor_base`; aceita `descricao`, `categoria`. |
| PUT | `/api/servicos/{id}` | Administrador | Atualiza `nome`, `descricao`, `valor_base`, `categoria` e `status`. |
| DELETE | `/api/servicos/{id}` | Administrador | Inativa o serviço. |

### Peças e estoque

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/api/pecas?busca=termo` | Autenticado | Lista peças ativas; busca por nome ou descrição. |
| GET | `/api/pecas/{id}` | Autenticado | Busca peça pelo ID. |
| POST | `/api/pecas` | Administrador | Cadastra peça. Requer `nome`, `preco_unitario`; aceita `descricao`, `quantidade_estoque` (padrão 0). |
| PUT | `/api/pecas/{id}` | Administrador | Atualiza `nome`, `descricao`, `preco_unitario`, `quantidade_estoque` e `status`. |
| PUT | `/api/pecas/{id}/estoque` | Administrador | Soma quantidade ao estoque. Corpo: `{"quantidade": 5}` (maior que zero). |
| DELETE | `/api/pecas/{id}` | Administrador | Inativa a peça. |

### Agendamentos

| Método | Caminho | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/api/agendamentos?id_cliente=1&status=Solicitado&data=2026-11-15` | Autenticado | Lista agendamentos. Cliente vê apenas os próprios; administrador pode filtrar por cliente, status e data. |
| GET | `/api/agendamentos/{id}` | Autenticado | Busca agendamento com dados do cliente, veículo e serviços associados. |
| POST | `/api/agendamentos` | Autenticado | Cria agendamento; exige `id_veiculo`, `data_agendamento` (`YYYY-MM-DD`) e `horario_agendamento` (`HH:MM:SS`). Administrador também informa `id_cliente`; cliente usa o próprio ID. Aceita `observacoes` e lista `servicos` (IDs). O status inicial é `Solicitado`; horário ocupado é rejeitado. |
| PUT | `/api/agendamentos/{id}/status` | Autenticado | Atualiza status para `Solicitado`, `Confirmado`, `Em andamento`, `Concluido` ou `Cancelado`. Administrador pode escolher qualquer um; cliente só pode cancelar. Pode aceitar `observacoes`. |

Exemplo de criação de agendamento por cliente:

```json
{
  "id_veiculo": 1,
  "data_agendamento": "2026-11-20",
  "horario_agendamento": "14:30:00",
  "observacoes": "Ruído ao frear",
  "servicos": [1, 2]
}
```

## Respostas e erros

A API retorna JSON. Em geral, erros de validação retornam `400`, falta de token ou token inválido retorna `401`, falta de permissão retorna `403`, registro ausente retorna `404` e falha inesperada retorna `500`. As mensagens de erro são enviadas no campo `erro`.

## Scripts disponíveis

- `npm start`: inicia o servidor.
- `npm run dev`: inicia com Nodemon para desenvolvimento.

## Estrutura principal

```text
src/
  app.js                  # Configuração do Express, CORS e JSON
  server.js               # Inicialização do servidor
  config/database.js      # Pool de conexões MySQL
  middlewares/auth.js     # Validação JWT e autorização de administrador
  routes/index.js         # Definição das rotas /api
  controllers/            # Regras dos recursos da API
```

## Banco de dados para testes locais

O arquivo `database/schema.sql` cria o banco `oficina_mecanica_db` e 13 tabelas. A API implementada atualmente usa `usuario`, `veiculo`, `servico`, `peca`, `agendamento` e `agendamento_servico`; as tabelas de orçamento, ordem de serviço e histórico também estão no schema para os módulos correspondentes. Execute o script uma vez em um banco novo. Ele não apaga tabelas existentes, mas as instruções `CREATE TABLE` não usam `IF NOT EXISTS`, então uma segunda execução pode parar com erro de tabela já existente.

### Pelo terminal do MySQL

Na pasta do projeto, rode:

```bash
cmd /c "mysql -u root -p < database\schema.sql"
```

Digite a senha do usuário MySQL quando solicitado. Se seu usuário não for `root`, substitua-o pelo usuário correto. O script cria o banco se ele ainda não existir. Como as tabelas são criadas sem `IF NOT EXISTS`, rode o script apenas uma vez ou em um banco limpo.

### Pelo MySQL Workbench

1. Abra `database/schema.sql` no Workbench.
2. Conecte-se ao servidor MySQL local.
3. Execute o script (ícone de raio).
4. Atualize a lista de schemas; o banco `oficina_mecanica_db` deverá aparecer.

Depois configure `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME=oficina_mecanica_db` no `.env`, conforme a seção de instalação, e inicie a API.

### Criar dados para testar

Cadastre um usuário administrador pela rota pública de cadastro:

```http
POST http://localhost:3000/api/auth/cadastrar
Content-Type: application/json
```

```json
{
  "nome": "Administrador Local",
  "email": "admin@local.test",
  "senha": "senha123",
  "perfil": "Administrador"
}
```

Em seguida faça login em `/api/auth/login` com o mesmo e-mail e senha e use o token retornado no header `Authorization: Bearer <TOKEN>`. Com esse perfil, cadastre clientes, veículos, serviços e peças para experimentar os demais endpoints. Para agendar, o veículo deve pertencer ao cliente informado e estar ativo.

Esse cadastro de administrador serve apenas para desenvolvimento local. O endpoint público aceita o perfil enviado; em produção, isso deve ser limitado para que usuários não possam se conceder privilégios administrativos.


