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
    
    // REINTEGRADO: Campo 'Solicitante' e espaçamento `column-gap: 2rem`
    formWrapper.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form" style="display: flex; flex-wrap: wrap; row-gap: 1.2rem; column-gap: 2rem;">
                <div style="flex: 2 1 60%;"><label for="form-nome">Nome do Projeto:</label><input type="text" id="form-nome" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-responsavel">Responsável:</label><select id="form-responsavel" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="Sistema">Sistema</option><option value="BI">BI</option></select></div>
                <div style="flex: 1 1 30%;"><label for="form-chamado">Nº do Chamado:</label><input type="text" id="form-chamado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
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
// ARQUIVO: script.js (Substitua apenas esta função)

async function carregarProjetos(isAdmin) {
    const colspan = isAdmin ? 10 : 9;
    const projectListTbody = document.getElementById('project-list');
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    query = query.order('created_at', { ascending: false });

    const { data: projetos, error } = await query;
    
    if (error) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`; return; }
    if (projetos.length === 0) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado para o filtro "${filtroAtual}".</td></tr>`; return; }
    
    projectListTbody.innerHTML = '';
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        if (isAdmin) {
            tr.dataset.projectId = p.id;

            // ===== A CORREÇÃO ESTÁ AQUI ABAIXO =====
            // Trocamos a chamada direta para 'atualizarCampo' por 'handleEnterPress'
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td><input type="text" value="${p.chamado||''}" onkeydown="handleEnterPress(event, ${p.id}, 'chamado')"/></td>
                <td><select onchange="atualizarCampo(${p.id}, 'responsavel', this.value)"><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option></select></td>
                <td><input type="text" value="${p.solicitante||''}" onkeydown="handleEnterPress(event, ${p.id}, 'solicitante')"/></td>
                <td><textarea onkeydown="handleEnterPress(event, ${p.id}, 'situacao')">${p.situacao||''}</textarea></td>
                <td><input type="date" value="${p.prazo||''}" onkeydown="handleEnterPress(event, ${p.id}, 'prazo')" /></td>
                <td><select onchange="atualizarCampo(${p.id}, 'prioridade', this.value)"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                <td><input type="text" value="${p.priorizado||''}" onkeydown="handleEnterPress(event, ${p.id}, 'priorizado')"/></td>
                <td><button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Excluir</button></td>`;
        } else {
            tr.innerHTML = `
                <td>${p.nome||''}</td>
                <td>${p.responsavel||''}</td>
                <td>${p.chamado||''}</td>
                <td>${p.solicitante||''}</td>
                <td>${p.situacao||''}</td>
                <td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td>
                <td>${p.prioridade||''}</td>
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
    // REINTEGRADO: Lógica para salvar 'solicitante'
    const formData = {
        nome: form.querySelector('#form-nome').value,
        chamado: form.querySelector('#form-chamado').value,
        situacao: form.querySelector('#form-situacao').value,
        prazo: form.querySelector('#form-prazo').value || null,
        responsavel: form.querySelector('#form-responsavel').value,
        solicitante: form.querySelector('#form-solicitante').value,
        prioridade: form.querySelector('#form-prioridade').value,
        priorizado: form.querySelector('#form-priorizado').value,
        user_id: user.id
    };

    if (!formData.nome) { alert('O nome do projeto é obrigatório.'); return; }
    const { error } = await supabaseClient.from('projetos').insert([formData]);
    if (error) { console.error(error); alert('Falha ao adicionar projeto.'); } else { form.reset(); carregarProjetos(true); }
}
async function atualizarCampo(id, coluna, valor) {
    const { error } = await supabaseClient.from('projetos').update({ [coluna]: valor }).eq('id', id);
    if (error) console.error(error); else { const tr = document.querySelector(`tr[data-project-id='${id}']`); if (tr) { tr.style.backgroundColor = '#d4edda'; setTimeout(() => { tr.style.backgroundColor = ''; }, 1500); } }
}
async function deletarProjeto(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o projeto "${nome}"?`)) {
        const { error } = await supabaseClient.from('projetos').delete().eq('id', id);
        if (error) { console.error('Erro ao deletar projeto:', error); alert('Falha ao excluir o projeto.'); }
        else { carregarProjetos(true); }
    }
}

// NOVO: Função que verifica se a tecla 'Enter' foi pressionada
function handleEnterPress(event, id, coluna) {
    // Verifica se a tecla pressionada foi 'Enter'
    if (event.key === 'Enter') {
        // Impede o comportamento padrão do Enter (como pular linha no textarea)
        event.preventDefault();
        
        // Pega o valor do campo que disparou o evento
        const valor = event.target.value;
        
        // Chama a função de atualização que já tínhamos
        atualizarCampo(id, coluna, valor);

        // Opcional: tira o foco do campo para dar um feedback visual de que foi salvo
        event.target.blur();
    }
}

window.atualizarCampo = atualizarCampo;
window.deletarProjeto = deletarProjeto;
window.handleEnterPress = handleEnterPress; // NOVO: Torna a nova função acessível para o HTML

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

// 6. PONTO DE PARTIDA DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    setupFiltros();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
            entrarModoAdmin(session.user);
        } else {
            entrarModoPublico();
        }
    });
});
