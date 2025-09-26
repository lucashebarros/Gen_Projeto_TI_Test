// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

// Inicializa o cliente Supabase usando o objeto global fornecido pelo CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Elemento da Tabela
const projectListTbody = document.getElementById('project-list');

/**
 * Função para carregar os projetos do Supabase e renderizar na tabela.
 */
async function carregarProjetos() {
    // Limpa a tabela e mostra mensagem de carregamento
    projectListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Carregando projetos...</td></tr>';

    // Usa a variável corrigida 'supabaseClient'
    const { data: projetos, error } = await supabaseClient
        .from('projetos')
        .select('*')
        .order('id', { ascending: true }); // Ordenar pelo ID pode ser mais estável

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        projectListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o console.</td></tr>';
        return;
    }

    // Limpa a tabela novamente antes de adicionar os novos dados
    projectListTbody.innerHTML = '';

    if (projetos.length === 0) {
        projectListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum projeto encontrado. Adicione um novo projeto no painel do Supabase para começar.</td></tr>';
        return;
    }

    // 3. Cria uma linha (<tr>) para cada projeto
    projetos.forEach(projeto => {
        const tr = document.createElement('tr');
        // Adiciona um ID à linha para referência futura, se necessário
        tr.dataset.projectId = projeto.id;
        tr.innerHTML = `
            <td>${projeto.nome}</td>
            
            <td>
                <textarea onblur="atualizarCampo(${projeto.id}, 'situacao', this.value)">${projeto.situacao || ''}</textarea>
            </td>

            <td>
                <input type="date" value="${projeto.prazo || ''}" onblur="atualizarCampo(${projeto.id}, 'prazo', this.value)" />
            </td>

            <td>
                <select onchange="atualizarCampo(${projeto.id}, 'prioridade', this.value)">
                    <option value="Alta" ${projeto.prioridade === 'Alta' ? 'selected' : ''}>Alta</option>
                    <option value="Média" ${projeto.prioridade === 'Média' ? 'selected' : ''}>Média</option>
                    <option value="Baixa" ${projeto.prioridade === 'Baixa' ? 'selected' : ''}>Baixa</option>
                    <option value="" ${!projeto.prioridade ? 'selected' : ''}>N/A</option>
                </select>
            </td>
        `;
        projectListTbody.appendChild(tr);
    });
}

/**
 * Função para atualizar um campo específico de um projeto no Supabase.
 * @param {number} id - O ID do projeto a ser atualizado.
 * @param {string} coluna - O nome da coluna a ser atualizada ('situacao', 'prazo', 'prioridade').
 * @param {string} valor - O novo valor para a coluna.
 */
async function atualizarCampo(id, coluna, valor) {
    console.log(`Atualizando projeto ${id}, coluna ${coluna} para: "${valor}"`);

/**
 * Função para ADICIONAR um novo projeto no Supabase.
 */
async function adicionarProjeto(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const form = event.target;
    const nomeInput = form.querySelector('#nome');
    const nomeProjeto = nomeInput.value;

    if (!nomeProjeto) {
        alert('Por favor, digite o nome do projeto.');
        return;
    }

    // Insere o novo projeto na tabela 'projetos'
    const { error } = await supabaseClient
        .from('projetos')
        .insert([
            { nome: nomeProjeto, situacao: 'Novo', prioridade: 'Média' } // Valores iniciais padrão
        ]);

    if (error) {
        console.error('Erro ao adicionar projeto:', error);
        alert('Falha ao adicionar o projeto.');
    } else {
        console.log('Projeto adicionado com sucesso!');
        form.reset(); // Limpa o formulário
        carregarProjetos(); // Recarrega a lista de projetos para mostrar o novo
    }
}

// 4. Carrega os projetos e configura o formulário quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();

    // Configura o formulário de adição
    const addForm = document.getElementById('add-project-form');
    addForm.addEventListener('submit', adicionarProjeto);
});
    // Usa a variável corrigida 'supabaseClient'
    const { error } = await supabaseClient
        .from('projetos')
        .update({ [coluna]: valor }) // [coluna] define a chave do objeto dinamicamente
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar o projeto:', error);
        alert('Falha ao salvar a alteração. Verifique o console para mais detalhes.');
    } else {
        console.log('Projeto atualizado com sucesso!');
        // Feedback visual: Adiciona uma classe temporária para indicar sucesso
        const tr = document.querySelector(`tr[data-project-id='${id}']`);
        if (tr) {
            tr.style.backgroundColor = '#d4edda'; // Verde claro
            setTimeout(() => {
                tr.style.backgroundColor = ''; // Remove a cor após 1.5s
            }, 1500);
        }
    }
}

// 4. Carrega os projetos assim que a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarProjetos);

// 4. Carrega os projetos assim que a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarProjetos);
