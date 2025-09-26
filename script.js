// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Elemento da Tabela
const projectListTbody = document.getElementById('project-list');

/**
 * Função para CARREGAR os projetos do Supabase e renderizar na tabela.
 */
async function carregarProjetos() {
    projectListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Carregando projetos...</td></tr>';

    const { data: projetos, error } = await supabaseClient
        .from('projetos')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        projectListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o console.</td></tr>';
        return;
    }

    projectListTbody.innerHTML = '';

    if (projetos.length === 0) {
        projectListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum projeto encontrado. Adicione um novo acima.</td></tr>';
        return;
    }

    projetos.forEach(projeto => {
        const tr = document.createElement('tr');
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
 * Função para ATUALIZAR um campo específico de um projeto.
 */
async function atualizarCampo(id, coluna, valor) {
    console.log(`Atualizando projeto ${id}, coluna ${coluna} para: "${valor}"`);

    const { error } = await supabaseClient
        .from('projetos')
        .update({ [coluna]: valor })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar o projeto:', error);
        alert('Falha ao salvar a alteração. Verifique o console para mais detalhes.');
    } else {
        console.log('Projeto atualizado com sucesso!');
        const tr = document.querySelector(`tr[data-project-id='${id}']`);
        if (tr) {
            tr.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                tr.style.backgroundColor = '';
            }, 1500);
        }
    }
}

/**
 * Função para ADICIONAR um novo projeto no Supabase.
 */
async function adicionarProjeto(event) {
    event.preventDefault();

    // Pega os valores de todos os campos do formulário
    const nome = document.getElementById('form-nome').value;
    const situacao = document.getElementById('form-situacao').value;
    const prazo = document.getElementById('form-prazo').value;
    const prioridade = document.getElementById('form-prioridade').value;

    if (!nome) {
        alert('O nome do projeto é obrigatório.');
        return;
    }

    const { error } = await supabaseClient
        .from('projetos')
        .insert([{ 
            nome: nome, 
            situacao: situacao, 
            prazo: prazo || null, // Envia nulo se o prazo estiver vazio
            prioridade: prioridade 
        }]);

    if (error) {
        console.error('Erro ao adicionar projeto:', error);
        alert('Falha ao adicionar o projeto. Verifique o console e as permissões (RLS) no Supabase.');
    } else {
        console.log('Projeto adicionado com sucesso!');
        document.getElementById('add-project-form').reset(); // Limpa o formulário
        carregarProjetos(); // Recarrega a lista de projetos
    }
}

// PONTO DE PARTIDA: Executa quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();

    // Configura o formulário de adição para chamar a função 'adicionarProjeto'
    const addForm = document.getElementById('add-project-form');
    addForm.addEventListener('submit', adicionarProjeto);
});
