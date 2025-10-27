// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Seleção dos Elementos HTML e Estado Global
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const headerAuthSection = document.getElementById('header-auth-section');
const formWrapper = document.getElementById('form-wrapper');
const actionsHeader = document.getElementById('actions-header');
let filtroAtual = 'Todos'; 
let usuarioLogado = null;

// 3. Funções e Lógica de Autenticação
function setupAuthListeners() {
    document.getElementById('close-login-button')?.addEventListener('click', () => { authContainer.classList.add('hidden'); });
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const button = authForm.querySelector('button');
        button.disabled = true; button.textContent = 'Aguarde...';
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        button.disabled = false; button.textContent = 'Entrar';
    });
}
async function logout() { await supabaseClient.auth.signOut(); }

// 4. Lógica de Controle de Estado (Admin vs. Público)
async function entrarModoAdmin(user) {
    usuarioLogado = user;
    authContainer.classList.add('hidden');
    const { data: profile } = await supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
    const displayName = profile?.full_name || user.email;
    headerAuthSection.innerHTML = `<span>Olá, ${displayName}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', logout);
    
    formWrapper.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form" style="display: flex; flex-wrap: wrap; row-gap: 1.2rem; column-gap: 2rem;">
                <div style="flex: 2 1 60%;"><label for="form-nome">Nome do Projeto:</label><input type="text" id="form-nome" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-chamado">Nº do Chamado:</label><input type="text" id="form-chamado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-responsavel">Responsável:</label><select id="form-responsavel" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="BI">BI</option><option value="Sistema">Sistema</option></select></div>
                <div style="flex: 1 1 30%;"><label for="form-solicitante">Solicitante:</label><input type="text" id="form-solicitante" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><label for="form-situacao">Situação Atual:</label><textarea id="form-situacao" style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea></div>
                <div style="flex: 1 1 30%;"><label for="form-prazo">Prazo:</label><input type="date" id="form-prazo" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-prioridade">Prioridade:</label><select id="form-prioridade" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="Alta">Alta</option><option value="Média" selected>Média</option><option value="Baixa">Baixa</option></select></div>
                <div style="flex: 1 1 100%;"><label for="form-priorizado">Priorizado Por:</label><input type="text" id="form-priorizado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Salvar Novo Projeto</button></div>
            </form>
        </div>`;
    document.getElementById('add-project-form').addEventListener('submit', adicionarProjeto);
    if (actionsHeader) actionsHeader.style.display = 'table-cell';
    carregarProjetos(true);
}

function entrarModoPublico() {
    usuarioLogado = null;
    headerAuthSection.innerHTML = `<button id="login-button">Admin / Login</button>`;
    document.getElementById('login-button').addEventListener('click', () => authContainer.classList.remove('hidden'));
    formWrapper.innerHTML = '';
    if (actionsHeader) actionsHeader.style.display = 'none';
    carregarProjetos(false);
}

// 5. Funções do Gerenciador de Projetos (CRUD)

// NOVO: Helper para ordenação
const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3, '': 4 };

async function carregarProjetos(isAdmin) {
    const colspan = isAdmin ? 11 : 10; // Aumentado para nova coluna + ações
    const projectListTbody = document.getElementById('project-list');
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    // REMOVIDO: a ordenação será feita no JavaScript agora
    // query = query.order('created_at', { ascending: false }); 

    const { data: projetosData, error } = await query;
    
    if (error) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`; return; }
    
    // NOVO: Ordena os projetos aqui no JavaScript
    const projetos = projetosData.sort((a, b) => {
        const priorityA = priorityOrder[a.prioridade || ''] || 99;
        const priorityB = priorityOrder[b.prioridade || ''] || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB; // Ordena por prioridade
        }
        // Se prioridades iguais, ordena pelo índice (trata null como 999)
        const indexA = a.priority_index ?? null; 
        const indexB = b.priority_index ?? null;
        return indexA - indexB;
    });

    if (projetos.length === 0) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado para o filtro "${filtroAtual}".</td></tr>`; return; }
    
    projectListTbody.innerHTML = '';
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        if (isAdmin) {
            tr.dataset.projectId = p.id;
            // NOVO: Adicionada a coluna de Índice editável
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td><select onchange="atualizarCampo(${p.id}, 'responsavel', this.value)"><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option></select></td>
                <td><input type="text" value="${p.chamado||''}" onkeydown="handleEnterPress(event, ${p.id}, 'chamado')"/></td>
                <td><input type="text" value="${p.solicitante||''}" onkeydown="handleEnterPress(event, ${p.id}, 'solicitante')"/></td>
                <td><textarea onkeydown="handleEnterPress(event, ${p.id}, 'situacao')">${p.situacao||''}</textarea></td>
                <td><input type="date" value="${p.prazo||''}" onkeydown="handleEnterPress(event, ${p.id}, 'prazo')" /></td>
                <td><select onchange="atualizarCampo(${p.id}, 'prioridade', this.value)"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                <td><input type="number" value="${p.priority_index||null}" onkeydown="handleEnterPress(event, ${p.id}, 'priority_index')" style="width: 60px; text-align: center;"/></td>
                <td><input type="text" value="${p.priorizado||''}" onkeydown="handleEnterPress(event, ${p.id}, 'priorizado')"/></td>
                <td><button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Excluir</button></td>`;
        } else {
             // NOVO: Adicionada a coluna de Índice na visão pública
            tr.innerHTML = `
                <td>${p.nome||''}</td>
                <td>${p.responsavel||''}</td>
                <td>${p.chamado||''}</td>
                <td>${p.solicitante||''}</td>
                <td>${p.situacao||''}</td>
                <td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td>
                <td>${p.prioridade||''}</td>
                <td>${p.priority_index ?? ''}</td> 
                <td>${p.priorizado||''}</td>`;
        }
        projectListTbody.appendChild(tr);
    });
}
async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');
    
    const form = event.target;
    // NOVO: Adiciona 'priority_index' com valor padrão ao salvar
    const formData = {
        nome: form.querySelector('#form-nome').value,
        chamado: form.querySelector('#form-chamado').value,
        situacao: form.querySelector('#form-situacao').value,
        prazo: form.querySelector('#form-prazo').value || null,
        responsavel: form.querySelector('#form-responsavel').value,
        solicitante: form.querySelector('#form-solicitante').value,
        prioridade: form.querySelector('#form-prioridade').value,
        priorizado: form.querySelector('#form-priorizado').value,
        priority_index: null, // Valor padrão para novos projetos
        user_id: user.id
    };

    if (!formData.nome) { alert('O nome do projeto é obrigatório.'); return; }
    const { error } = await supabaseClient.from('projetos').insert([formData]);
    if (error) { console.error(error); alert('Falha ao adicionar projeto.'); } else { form.reset(); carregarProjetos(true); }
}
async function atualizarCampo(id, coluna, valor) {
    // NOVO: Converte o índice para número antes de salvar
    let valorFinal = valor;
    if (coluna === 'priority_index') {
        valorFinal = parseInt(valor, 10);
        // Evita salvar NaN (Not a Number) se o campo for apagado
        if (isNaN(valorFinal)) valorFinal = 999; 
    }

    const { error } = await supabaseClient.from('projetos').update({ [coluna]: valorFinal }).eq('id', id);
    if (error) console.error(error); else { 
        // NOVO: Recarrega a lista após salvar o índice para garantir a ordem correta
        if (coluna === 'priority_index') {
            carregarProjetos(true);
        } else {
             const tr = document.querySelector(`tr[data-project-id='${id}']`); 
             if (tr) { tr.style.backgroundColor = '#d4edda'; setTimeout(() => { tr.style.backgroundColor = ''; }, 1500); } 
        }
    }
}
async function deletarProjeto(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o projeto "${nome}"?`)) {
        const { error } = await supabaseClient.from('projetos').delete().eq('id', id);
        if (error) { console.error('Erro ao deletar projeto:', error); alert('Falha ao excluir o projeto.'); }
        else { carregarProjetos(true); }
    }
}
function handleEnterPress(event, id, coluna) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const valor = event.target.value;
        atualizarCampo(id, coluna, valor);
        event.target.blur();
    }
}
window.atualizarCampo = atualizarCampo;
window.deletarProjeto = deletarProjeto;
window.handleEnterPress = handleEnterPress;

function setupFiltros() {
    const botoes = document.querySelectorAll('.filter-btn');
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');
            filtroAtual = botao.textContent;
            const isAdmin = !!usuarioLogado;
            carregarProjetos(isAdmin);
        });
    });
}
// ARQUIVO: script.js (Substitua apenas esta seção final)

// Variável para rastrear o ID do usuário atualmente exibido na UI
let currentUserId = null; 

// 6. PONTO DE PARTIDA DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    setupAuthListeners();
    setupFiltros();

    const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
    currentUserId = initialSession?.user?.id ?? null; // Define o ID inicial
    if (initialSession && initialSession.user) {
        console.log('Initial load: User is logged in.');
        entrarModoAdmin(initialSession.user);
    } else {
        console.log('Initial load: User is logged out.');
        entrarModoPublico();
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        const newUserId = session?.user?.id ?? null;

        if (newUserId !== currentUserId) {
            console.log('Auth state changed:', _event, ' New user ID:', newUserId);
            currentUserId = newUserId; // Atualiza o ID rastreado

            if (session && session.user) {
                entrarModoAdmin(session.user);
            } else {
                entrarModoPublico();
            }
        } else {
            console.log('Auth state event ignored (user unchanged):', _event);
        }
    });
});

window.atualizarCampo = atualizarCampo;
window.deletarProjeto = deletarProjeto;
window.handleEnterPress = handleEnterPress;
