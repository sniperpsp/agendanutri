-- Tabela de Alimentos
-- Cria a tabela de alimentos com campos para nome, proteínas, carboidratos e gorduras.
CREATE TABLE IF NOT EXISTS alimentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    proteinas DECIMAL(5,2),
    carboidratos DECIMAL(5,2),
    gorduras DECIMAL(5,2),
    nome_en VARCHAR(100) UNIQUE,  -- Adicionando a coluna nome_en para o nome em inglês
    CONSTRAINT alimentos_nome_unico UNIQUE (nome)  -- Garantir que o nome do alimento seja único
);

-- Tabela de Registros de Alimentação
-- Cria a tabela para armazenar os registros de alimentação com relação a alimentos e peso.
CREATE TABLE IF NOT EXISTS alimentacao (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    alimento_id INT NOT NULL,
    peso_gramas INT NOT NULL,
    user_id INT,  -- Coluna para o usuário associado
    FOREIGN KEY (alimento_id) REFERENCES alimentos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL  -- Garantir integridade referencial para o usuário
);

-- Tabela de Peso
-- Cria a tabela para armazenar o peso dos usuários em diferentes datas.
CREATE TABLE IF NOT EXISTS peso (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    peso_kg DECIMAL(5,2) NOT NULL,
    user_id INT,  -- Coluna para o usuário associado
    variacao DECIMAL(5,2),  -- Adicionando a coluna variacao
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL  -- Integridade referencial para o usuário
);

-- Tabela de Peso Histórico
-- Registra a evolução histórica do peso, incluindo variação de peso e timestamp de criação.
CREATE TABLE IF NOT EXISTS peso_historico (
    id SERIAL PRIMARY KEY,
    peso DECIMAL(5,2) NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    variacao DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
-- Cria a tabela para armazenar os usuários do sistema.
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar a coluna 'nome_en' na tabela de alimentos, se não existir
-- Essa coluna armazenará a versão do nome do alimento em inglês.
ALTER TABLE IF EXISTS alimentos
    ADD COLUMN IF NOT EXISTS nome_en VARCHAR(100);

-- Criar índice único para 'nome_en' na tabela de alimentos
CREATE UNIQUE INDEX IF NOT EXISTS idx_nome_en ON alimentos(nome_en);

-- Modificar as tabelas existentes para adicionar 'user_id'
-- Adicionar a coluna 'user_id' em 'alimentacao' e 'peso_historico'
ALTER TABLE IF EXISTS alimentacao ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES usuarios(id);
ALTER TABLE IF EXISTS peso_historico ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES usuarios(id);

-- Adicionar constraints de integridade referencial entre as tabelas de 'alimentacao' e 'usuarios'
ALTER TABLE IF EXISTS alimentacao
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS peso_historico
    ADD CONSTRAINT fk_user_id_peso_historico FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;
