// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

// 1. Configuração do Cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Seleção dos Elementos HTML
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const headerAuthSection = document.getElementById('header-auth-section');
const formWrapper = document.getElementById('form-wrapper');
// NOVO: Seleciona o cabeçalho da coluna de ações
const actionsHeader = document.getElementById('actions-header');

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
    authContainer.classList.add('hidden');
    const { data: profile } = await supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
    const displayName = profile?.full_name || user.email;
    headerAuthSection.innerHTML = `<span>Olá, ${displayName}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', logout);
    
    // CORREÇÃO: Apenas mostra o formulário, não recria a tabela
    formWrapper.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form" style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 2 1 60%;"><label for="form-nome">Nome do Projeto:</label><input type="text" id="form-nome" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-chamado">Nº do Chamado:</label><input type="text" id="form-chamado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><label for="form-situacao">Situação Atual:</label><textarea id="form-situacao" style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea></div>
                <div style="flex: 1 1 30%;"><label for="form-prazo">Prazo:</label><input type="date" id="form-prazo" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-responsavel">Responsável:</label><input type="text" id="form-responsavel" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-prioridade">Prioridade:</label><select id="form-prioridade" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="Alta">Alta</option><option value="Média" selected>Média</option><option value="Baixa">Baixa</option></select></div>
                <div style="flex: 1 1 100%;"><label for="form-priorizado">Priorizado Por:</label><input type="text" id="form-priorizado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><button type="submit" style="background-color: #57F572; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Salvar Novo Projeto</button></div>
            </form>
        </div>`;
    document.getElementById('add-project-form').addEventListener('submit', adicionarProjeto);
    
    // CORREÇÃO: Mostra a coluna de Ações
    if (actionsHeader) actionsHeader.style.display = 'table-cell';
    
    carregarProjetos(true);
}

function entrarModoPublico() {
    headerAuthSection.innerHTML = `<button id="login-button">Admin / Login</button>`;
    document.getElementById('login-button').addEventListener('click', () => authContainer.classList.remove('hidden'));
    formWrapper.innerHTML = '';
    
    // CORREÇÃO: Esconde a coluna de Ações
    if (actionsHeader) actionsHeader.style.display = 'none';

    carregarProjetos(false);
}

// 5. Funções do Gerenciador de Projetos (CRUD)
async function carregarProjetos(isAdmin) {
    const colspan = isAdmin ? 8 : 7;
    const projectListTbody = document.getElementById('project-list');
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;
    const { data: projetos, error } = await supabaseClient.from('projetos').select('*').order('created_at', { ascending: false });
    if (error) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`; return; }
    if (projetos.length === 0) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado.</td></tr>`; return; }
    
    projectListTbody.innerHTML = '';
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        if (isAdmin) {
            tr.dataset.projectId = p.id;
            tr.innerHTML = `<td>${p.nome}</td><td><input type="text" value="${p.chamado||''}" onblur="atualizarCampo(${p.id}, 'chamado', this.value)" style="width:100px;"/></td><td><input type="text" value="${p.responsavel||''}" onblur="atualizarCampo(${p.id}, 'responsavel', this.value)" style="width:120px;"/></td><td><textarea onblur="atualizarCampo(${p.id}, 'situacao', this.value)">${p.situacao||''}</textarea></td><td><input type="date" value="${p.prazo||''}" onblur="atualizarCampo(${p.id}, 'prazo', this.value)" /></td><td><select onchange="atualizarCampo(${p.id}, 'prioridade', this.value)"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td><td><input type="text" value="${p.priorizado||''}" onblur="atualizarCampo(${p.id}, 'priorizado', this.value)" style="width:120px;"/></td><td><button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Excluir</button></td>`;
        } else {
            tr.innerHTML = `<td>${p.nome||''}</td><td>${p.chamado||''}</td><td>${p.responsavel||''}</td><td>${p.situacao||''}</td><td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td><td>${p.prioridade||''}</td><td>${p.priorizado||''}</td>`;
        }
        projectListTbody.appendChild(tr);
    });
}
async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');
    const form = event.target;
    const formData = {nome: form.querySelector('#form-nome').value, chamado: form.querySelector('#form-chamado').value, situacao: form.querySelector('#form-situacao').value, prazo: form.querySelector('#form-prazo').value || null, responsavel: form.querySelector('#form-responsavel').value, prioridade: form.querySelector('#form-prioridade').value, priorizado: form.querySelector('#form-priorizado').value, user_id: user.id};
    if (!formData.nome) { alert('O nome do projeto é obrigatório.'); return; }
    const { error } = await supabaseClient.from('projetos').insert([formData]);
    if (error) { console.error(error); alert('Falha ao adicionar projeto.'); } else { form.reset(); carregarProjetos(true); }
}
async function atualizarCampo(id, coluna, valor) {
    const { error } = await supabaseClient.from('projetos').update({ [coluna]: valor }).eq('id', id);
    if (error) console.error(error); else { const tr = document.querySelector(`tr[data-project-id='${id}']`); if (tr) { tr.style.backgroundColor = '#d4edda'; setTimeout(() => { tr.style.backgroundColor = ''; }, 1500); } }
}
async function deletarProjeto(id, nome) {
    const confirmacao = confirm(`Tem certeza que deseja excluir o projeto "${nome}"? Esta ação não pode ser desfeita.`);
    if (confirmacao) {
        const { error } = await supabaseClient.from('projetos').delete().eq('id', id);
        if (error) { console.error('Erro ao deletar projeto:', error); alert('Falha ao excluir o projeto.'); }
        else { carregarProjetos(true); }
    }
}
window.atualizarCampo = atualizarCampo;
window.deletarProjeto = deletarProjeto;

// 6. PONTO DE PARTIDA DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
            entrarModoAdmin(session.user);
        } else {
            entrarModoPublico();
        }
    });
});
