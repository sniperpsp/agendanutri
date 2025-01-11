# README

Este projeto é uma aplicação Node.js que permite gerenciar informações nutricionais de alimentos, registros alimentares e histórico de peso. A aplicação funciona tanto localmente quanto em contêineres Docker para maior flexibilidade e portabilidade.

---

## Pré-requisitos

### Para execução local:
- Node.js (v16 ou superior)
- PostgreSQL (v15 ou superior)

### Para execução com Docker:
- Docker
- Docker Compose

---

## Executando com Docker

### Passo 1: Construir as imagens Docker

1. Certifique-se de que os arquivos `Dockerfile` e `docker-compose.yml` estão na raiz do projeto.
2. Construa as imagens Docker:

   ```bash
   docker-compose build
   ```

### Passo 2: Subir os contêineres

1. Inicie os contêineres em background:

   ```bash
   docker-compose up -d
   ```

2. O contêiner da aplicação será iniciado com base no `Dockerfile` e o banco de dados PostgreSQL será configurado com base no `docker-compose.yml`.

3. Para verificar os logs da aplicação:

   ```bash
   docker-compose logs -f
   ```

### Passo 3: Configurar variáveis de ambiente

Se precisar alterar as configurações do banco de dados (como usuário, senha ou nome do banco), edite o arquivo `docker-compose.yml` ou defina as variáveis de ambiente no sistema:

- `DB_USER` (Usuário do PostgreSQL)
- `DB_PASSWORD` (Senha do PostgreSQL)
- `DB_NAME` (Nome do banco de dados)
- `DB_HOST` (Host do PostgreSQL - geralmente `db` no Docker Compose)
- `DB_PORT` (Porta do PostgreSQL, padrão: `5432`)

### Acessando a aplicação

A aplicação será iniciada e estará acessível em:

```
http://localhost:80
```

---

## Executando Localmente

### Passo 1: Configurar o banco de dados PostgreSQL

1. Certifique-se de que um servidor PostgreSQL está em execução localmente.
2. Crie um banco de dados chamado `controle_alimentacao` ou altere o nome no arquivo `.env` (se aplicável).
3. Execute o script `init.sql` para criar as tabelas e configurar o banco de dados:

   ```bash
   psql -U <seu_usuario> -d controle_alimentacao -f init.sql
   ```

### Passo 2: Instalar dependências

1. Instale as dependências do projeto:

   ```bash
   npm install
   ```

### Passo 3: Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:

```
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=controle_alimentacao
DB_HOST=localhost
DB_PORT=5432
```

### Passo 4: Iniciar a aplicação

1. Inicie a aplicação com o comando:

   ```bash
   node server.js
   ```

2. A aplicação estará disponível em:

   ```
   http://localhost:80
   ```

---

## Estrutura do Projeto

- `server.js`: Código principal da aplicação Node.js.
- `init.sql`: Script SQL para criação das tabelas no banco de dados PostgreSQL.
- `Dockerfile`: Configuração para construir a imagem Docker da aplicação.
- `docker-compose.yml`: Configuração para subir o banco de dados PostgreSQL e a aplicação simultaneamente com Docker Compose.
- `public/`: Arquivos estáticos da aplicação.

---

## Testando a Aplicação

### Rotas Principais

- **GET /**: Página inicial da aplicação.
- **POST /api/alimentos**: Adicionar um alimento ao banco de dados.
- **GET /api/registros**: Obter registros alimentares por data.
- **POST /api/registrar-peso**: Registrar peso e calcular a variação.
- **GET /api/historico-peso**: Obter o histórico de peso.

### Exemplos de Requisição

**Exemplo de requisição POST para registrar um alimento:**

```json
{
  "alimento": "banana",
  "peso": 150,
  "data": "2025-01-01",
  "hora": "12:30"
}
```

---

## Observações

1. Certifique-se de que as portas configuradas no `docker-compose.yml` e no `server.js` não estejam sendo usadas por outros serviços.
2. Alterações nas tabelas do banco de dados devem ser refletidas no script `init.sql`.
3. Para quaisquer dúvidas ou problemas, verifique os logs da aplicação com:

   ```bash
   docker-compose logs -f
   ```

