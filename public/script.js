document.addEventListener('DOMContentLoaded', () => {
    // Configurar data e hora atual nos inputs
    configurarDataHoraAtual();
    // Carregar dados iniciais
    carregarRegistrosPorData(new Date().toISOString().split('T')[0]);
    carregarHistoricoPeso();
    atualizarResumoDiario(new Date().toISOString().split('T')[0]);
});

// Configurar data e hora atual nos inputs
function configurarDataHoraAtual() {
    const dataAtual = new Date().toISOString().split('T')[0];
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('data').value = dataAtual;
    document.getElementById('data-peso').value = dataAtual;
    document.getElementById('filtro-data').value = dataAtual;
    document.getElementById('hora').value = horaAtual;
}

// Formulário de alimentação
document.getElementById('alimentacaoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        alimento: document.getElementById('alimento').value,
        peso: document.getElementById('peso').value,
        data: document.getElementById('data').value,
        hora: document.getElementById('hora').value
    };

    try {
        mostrarLoading();
        const response = await fetch(`/api/alimentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao registrar refeição');
        
        const data = await response.json();
        console.log('Sucesso:', data);

        // Limpar formulário
        document.getElementById('alimento').value = '';
        document.getElementById('peso').value = '';

        // Atualizar registros
        carregarRegistrosPorData(formData.data);
        atualizarResumoDiario(formData.data);
        mostrarNotificacao('Refeição registrada com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao registrar refeição', 'erro');
    } finally {
        ocultarLoading();
    }
});

// Filtro de data
document.getElementById('filtro-data').addEventListener('change', (e) => {
    carregarRegistrosPorData(e.target.value);
});

document.getElementById('btn-hoje').addEventListener('click', () => {
    const dataAtual = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-data').value = dataAtual;
    carregarRegistrosPorData(dataAtual);
});

// Carregar registros por data
async function carregarRegistrosPorData(data) {
    try {
        const response = await fetch(`/api/registros?data=${data}`);
        if (!response.ok) throw new Error('Erro ao carregar registros');
        
        const registros = await response.json();
        console.log(registros); // Verifique a estrutura dos dados retornados
        atualizarTabelaRegistros(registros);
    } catch (error) {
        console.error('Erro:', error);
    }
}
// Atualizar a tabela de registros
function atualizarTabelaRegistros(registros) {
    const tbody = document.querySelector('#registrosTable tbody');
    tbody.innerHTML = '';

    registros.forEach(registro => {
        const proteinasTotal = (registro.peso_gramas / 100) * registro.proteinas || 0;
        const carboidratosTotal = (registro.peso_gramas / 100) * registro.carboidratos || 0;
        const gordurasTotal = (registro.peso_gramas / 100) * registro.gorduras || 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${registro.nome ? registro.nome.toUpperCase() : 'N/A'}</td>
            <td>${registro.hora || 'N/A'}</td>
            <td>${registro.peso_gramas || 'N/A'}</td>
            <td>${registro.proteinas || 'N/A'}</td>
            <td>${proteinasTotal.toFixed(2) || 'N/A'}</td>
            <td>${registro.carboidratos || 'N/A'}</td>
            <td>${carboidratosTotal.toFixed(2) || 'N/A'}</td>
            <td>${registro.gorduras || 'N/A'}</td>
            <td>${gordurasTotal.toFixed(2) || 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Atualizar resumo diário
async function atualizarResumoDiario(data) {
    try {
        const response = await fetch(`/api/resumo-diario?data=${data}`);
        if (!response.ok) throw new Error('Erro ao carregar resumo diário');
        const resumo = await response.json();

        document.getElementById('total-proteinas').textContent = resumo.total_proteinas || '0';
        document.getElementById('total-carboidratos').textContent = resumo.total_carboidratos || '0';
        document.getElementById('total-gorduras').textContent = resumo.total_gorduras || '0';
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar resumo diário', 'erro');
    }
}

// Registrar peso
document.getElementById('registrar-peso').addEventListener('click', async () => {
    const peso = document.getElementById('peso-atual').value;
    const data = document.getElementById('data-peso').value;

    try {
        mostrarLoading();
        const response = await fetch(`/api/registrar-peso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peso, data })
        });

        if (!response.ok) throw new Error('Erro ao registrar peso');
        
        const resultado = await response.json(); // Obter a resposta da API
        document.getElementById('peso-atual').value = '';

        // Atualizar o card de peso atual com o último peso inserido
        document.getElementById('ultimo-peso').textContent = resultado.ultimoPeso.peso_kg; // Atualiza o peso atual
        document.getElementById('variacao-peso').textContent = resultado.ultimoPeso.variacao; // Atualiza a variação

        mostrarNotificacao('Peso registrado com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao registrar peso', 'erro');
    } finally {
        ocultarLoading();
    }
});

// Atualizar cards de peso
function atualizarCardsPeso(ultimoRegistro) {
    if (ultimoRegistro) {
        document.getElementById('ultimo-peso').textContent = ultimoRegistro.peso_kg; // Atualiza o peso atual
        const variacaoElement = document.getElementById('variacao-peso');
        variacaoElement.textContent = ultimoRegistro.variacao !== null ? ultimoRegistro.variacao : '0.0';

        const variacaoCard = document.querySelector('.peso-card.variacao');
        variacaoCard.classList.toggle('negativo', ultimoRegistro.variacao < 0);
    }
}

// Carregar histórico de peso
async function carregarHistoricoPeso() {
    try {
        const response = await fetch(`/api/historico-peso`);
        if (!response.ok) throw new Error('Erro ao carregar histórico de peso');
        const data = await response.json();
        atualizarTabelaPeso(data.historico);
        atualizarCardsPeso(data.historico[0]);
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar histórico de peso', 'erro');
    }
}

// Atualizar tabela de peso
function atualizarTabelaPeso(historico) {
    const tbody = document.querySelector('#pesoTable tbody');
    tbody.innerHTML = '';

    historico.forEach(registro => {
        const tr = document.createElement('tr');
        const variacaoClass = registro.variacao > 0 ? 'variacao-positiva' : 'variacao-negativa';
        const variacaoSinal = registro.variacao > 0 ? '+' : '';
        
        tr.innerHTML = `
            <td>${registro.id}</td> <!-- Exibir o ID -->
            <td>${registro.data}</td>
            <td>${registro.peso_kg} kg</td>
            <td class="${variacaoClass}">${registro.variacao !== null ? variacaoSinal + registro.variacao + ' kg' : '-'}</td>
            <td>
                <button onclick="excluirRegistroPeso(${registro.id})" class="btn-excluir">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Excluir registro de peso
async function excluirRegistroPeso(id) {
    console.log(`Tentando excluir o registro com ID: ${id}`); // Debugging
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
        mostrarLoading();
        const response = await fetch(`/api/peso/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir registro');
        
        await carregarHistoricoPeso(); // Recarregar o histórico após a exclusão
        mostrarNotificacao('Registro excluído com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao excluir registro', 'erro');
    } finally {
        ocultarLoading();
    }
}

// Funções para mostrar e ocultar loading
function mostrarLoading() {
    document.getElementById('loading').style.display = 'block';
}

function ocultarLoading() {
    document.getElementById('loading').style.display = 'none';
}

function mostrarNotificacao(mensagem, tipo) {
    const div = document.createElement('div');
    div.classList.add('notificacao', tipo);
    div.textContent = mensagem;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}