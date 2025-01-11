const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const winston = require('winston');
const translate = require('google-translate-api-x');
const axios = require('axios');
const fetch = require('node-fetch');
const { format } = require('date-fns'); // Importando a biblioteca date-fns
const app = express();
const port = 80;

// Configura??o dos middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura??o do logger (Winston)
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
        new winston.transports.File({ filename: 'logs/app.log' })
    ],
});

// Configura??o do PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'controle_alimentacao',
    password: process.env.DB_PASSWORD || '33557788',
    port: process.env.DB_PORT || 5432,
});

// Middleware para logs de requisi??es
app.use((req, res, next) => {
    logger.info(`Recebido ${req.method} para ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.set('Content-Type', 'text/html; charset=utf-8');
        }
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css; charset=utf-8');
        }
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// Fun??es auxiliares
function removerCaracteresEspeciais(texto) {
    if (!texto) return '';
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
        .trim();
}

async function traduzirParaIngles(nomeAlimento) {
    try {
        const resultado = await translate(nomeAlimento, { from: 'pt', to: 'en' });
        logger.info(`Tradução: ${nomeAlimento} -> ${resultado.text}`);
        return resultado.text;
    } catch (err) {
        logger.error(`Erro ao traduzir alimento: ${err.message}`);
        return null;
    }
}

async function buscarInformacoesNutricionais(nomeIngles) {
    try {
        logger.info(`Buscando informações nutricionais para: ${nomeIngles}`);
        
        const response = await axios.post(
            'https://trackapi.nutritionix.com/v2/natural/nutrients',
            { 
                query: nomeIngles,
                timezone: "US/Eastern"
            },
            {
                headers: {
                    'x-app-id': '5ae21775',
                    'x-app-key': '757892a41514d4a62d0a2dedecf3ee2c',
                    'x-remote-user-id': '0'
                }
            }
        );

        if (response.data && response.data.foods && response.data.foods.length > 0) {
            const food = response.data.foods[0];
            return {
                proteinas: parseFloat(food.nf_protein) || 0,
                carboidratos: parseFloat(food.nf_total_carbohydrate) || 0,
                gorduras: parseFloat(food.nf_total_fat) || 0
            };
        }
        
        return null;
    } catch (error) {
        logger.error(`Erro ao buscar informa??es nutricionais: ${error.message}`);
        return null;
    }
}

// Rotas principais
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints
app.post('/api/alimentos', async (req, res) => {
    const { alimento, peso, data, hora } = req.body;

    try {
        const alimentoSemEspeciais = removerCaracteresEspeciais(alimento);
        logger.info(`Processando alimento: ${alimentoSemEspeciais}`);

        const nomeIngles = await traduzirParaIngles(alimentoSemEspeciais);
        if (!nomeIngles) {
            return res.status(500).json({ erro: 'Erro ao traduzir o nome do alimento' });
        }

        // Verificar se o alimento j? existe
        let alimentoId;
        const alimentoExistente = await pool.query(
            `SELECT id FROM alimentos WHERE nome = $1`,
            [alimento]
        );

        if (alimentoExistente.rows.length > 0) {
            // Alimento j? existe
            alimentoId = alimentoExistente.rows[0].id;
        } else {
            // Inserir novo alimento
            const infoNutricional = await buscarInformacoesNutricionais(nomeIngles);
            if (!infoNutricional) {
                return res.status(500).json({ erro: 'Erro ao buscar informa??es nutricionais' });
            }

            const resultInsercao = await pool.query(
                `INSERT INTO alimentos (nome, nome_en, proteinas, carboidratos, gorduras) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id`,
                [alimento, nomeIngles, infoNutricional.proteinas, infoNutricional.carboidratos, infoNutricional.gorduras]
            );

            alimentoId = resultInsercao.rows[0].id;
        }

        // Registrar a alimenta??o
        await registrarAlimentacao(alimentoId, peso, data, hora, res);
    } catch (error) {
        logger.error(`Erro ao registrar alimento: ${error.message}`);
        res.status(500).json({ erro: 'Erro ao registrar alimento' });
    }
});
// Fun??o auxiliar para registrar alimenta??o
async function registrarAlimentacao(alimentoId, peso, data, hora, res) {
    try {
        await pool.query(
            `INSERT INTO alimentacao (alimento_id, peso_gramas, data, hora) 
             VALUES ($1, $2, $3, $4)`,
            [alimentoId, peso, data, hora]
        );

        res.status(201).json({ mensagem: 'Alimenta??o registrada com sucesso' });
    } catch (err) {
        logger.error(`Erro ao registrar alimenta??o: ${err.message}`);
        res.status(500).json({ erro: 'Erro ao registrar alimenta??o' });
    }
}

// Carregar registros por data
app.get('/api/registros', async (req, res) => {
    const { data } = req.query; // Obter a data da query string
    try {
        const registros = await pool.query(`
            SELECT a.nome, al.hora, al.peso_gramas, a.proteinas, a.carboidratos, a.gorduras
            FROM alimentacao al
            JOIN alimentos a ON al.alimento_id = a.id
            WHERE al.data = $1
        `, [data]);
        
        res.json(registros.rows);
    } catch (error) {
        logger.error(`Erro ao carregar registros: ${error.message}`);
        res.status(500).json({ erro: 'Erro ao carregar registros' });
    }
});

// Carregar resumo di?rio
app.get('/api/resumo-diario', async (req, res) => {
    const { data } = req.query; // Obter a data da query string
    try {
        const resumo = await pool.query(`
            SELECT 
                SUM(a.proteinas) AS total_proteinas,
                SUM(a.carboidratos) AS total_carboidratos,
                SUM(a.gorduras) AS total_gorduras
            FROM alimentacao al
            JOIN alimentos a ON al.alimento_id = a.id
            WHERE al.data = $1
        `, [data]);
        
        // Verifica se o resultado ? nulo
        if (!resumo.rows[0]) {
            return res.json({ total_proteinas: 0, total_carboidratos: 0, total_gorduras: 0 });
        }

        res.json(resumo.rows[0]);
    } catch (error) {
        logger.error(`Erro ao carregar resumo di?rio: ${error.message}`);
        res.status(500).json({ erro: 'Erro ao carregar resumo di?rio' });
    }
});

// Registrar peso
app.post('/api/registrar-peso', async (req, res) => {
    const { peso, data } = req.body;

    try {
        // Obter o ?ltimo peso registrado
        const ultimoPeso = await pool.query('SELECT peso_kg FROM peso ORDER BY data DESC LIMIT 1');
        const pesoAnterior = ultimoPeso.rows.length > 0 ? ultimoPeso.rows[0].peso_kg : 0;

        // Calcular a varia??o
        const variacao = peso - pesoAnterior;

        // Inserir o novo peso e a varia??o
        await pool.query(
            `INSERT INTO peso (peso_kg, data, variacao) 
             VALUES ($1, $2, $3)`,
            [peso, data, variacao]
        );

        // Retornar o ?ltimo peso inserido
        res.status(201).json({
            mensagem: 'Peso registrado com sucesso',
            ultimoPeso: {
                peso_kg: peso,
                variacao: variacao
            }
        });
    } catch (error) {
        console.error(`Erro ao registrar peso: ${error.message}`);
        res.status(500).json({ erro: 'Erro ao registrar peso' });
    }
});

// Carregar hist?rico de peso
app.get('/api/historico-peso', async (req, res) => {
    try {
        const historico = await pool.query('SELECT * FROM peso ORDER BY data DESC');
        res.json({ historico: historico.rows });
    } catch (error) {
        console.error(`Erro ao carregar hist?rico de peso: ${error.message}`);
        res.status(500).json({ erro: 'Erro ao carregar hist?rico de peso' });
    }
});

// Deletar registro de peso
app.delete('/api/peso/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM peso WHERE id = $1', [id]);
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Erro ao excluir registro de peso: ${error.message}`);
        res.status(500).json({ erro: 'Erro ao excluir registro de peso' });
    }
});

// Inicializa??o do servidor
app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});