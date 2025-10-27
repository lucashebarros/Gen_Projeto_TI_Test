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

const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3, '': 4 };

async function carregarProjetos(isAdmin) {
    const colspan = isAdmin ? 11 : 10;
    const projectListTbody = document.getElementById('project-list');
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    const { data: projetosData, error } = await query;
    if (error) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`; return; }
    
    const projetos = projetosData.sort((a, b) => {
        const priorityA = priorityOrder[a.prioridade || ''] || 99;
        const priorityB = priorityOrder[b.prioridade || ''] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        const indexA = a.priority_index ?? 999; 
        const indexB = b.priority_index ?? 999;
        return indexA - indexB;
    });

    if (projetos.length === 0) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado para o filtro "${filtroAtual}".</td></tr>`; return; }
    
    projectListTbody.innerHTML = '';
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = p.id; // Importante manter o ID na linha

        if (isAdmin) {
            // ALTERADO: Removido 'onkeydown' dos inputs/textareas. Adicionado botão 'Salvar'.
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td><select data-column="responsavel"><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option></select></td>
                <td><input type="text" data-column="chamado" value="${p.chamado||''}"/></td>
                <td><input type="text" data-column="solicitante" value="${p.solicitante||''}"/></td>
                <td><textarea data-column="situacao">${p.situacao||''}</textarea></td>
                <td><input type="date" data-column="prazo" value="${p.prazo||''}" /></td>
                <td><select data-column="prioridade"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                <td><input type="number" data-column="priority_index" value="${p.priority_index||'999'}" style="width: 60px; text-align: center;"/></td>
                <td><input type="text" data-column="priorizado" value="${p.priorizado||''}"/></td>
                <td>
                    <button onclick="salvarAlteracoesProjeto(${p.id}, this)" style="background: #4CAF50; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Salvar</button>
                    <button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Excluir</button>
                </td>`;
        } else {
            tr.innerHTML = `<td>${p.nome||''}</td><td>${p.responsavel||''}</td><td>${p.chamado||''}</td><td>${p.solicitante||''}</td><td>${p.situacao||''}</td><td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td><td>${p.prioridade||''}</td><td>${p.priority_index ?? ''}</td><td>${p.priorizado||''}</td>`;
        }
        projectListTbody.appendChild(tr);
    });
}
async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');
    const form = event.target;
    const formData = {nome: form.querySelector('#form-nome').value, chamado: form.querySelector('#form-chamado').value, situacao: form.querySelector('#form-situacao').value, prazo: form.querySelector('#form-prazo').value || null, responsavel: form.querySelector('#form-responsavel').value, solicitante: form.querySelector('#form-solicitante').value, prioridade: form.querySelector('#form-prioridade').value, priorizado: form.querySelector('#form-priorizado').value, priority_index: 999, user_id: user.id};
    if (!formData.nome) { alert('O nome do projeto é obrigatório.'); return; }
    const { error } = await supabaseClient.from('projetos').insert([formData]);
    if (error) { console.error(error); alert('Falha ao adicionar projeto.'); } else { form.reset(); carregarProjetos(true); }
}

// REMOVIDO: A função 'atualizarCampo' não é mais necessária com o botão Salvar
// async function atualizarCampo(id, coluna, valor) { ... } 

// NOVO: Função para salvar TODAS as alterações de uma linha
async function salvarAlteracoesProjeto(id, buttonElement) {
    const tr = document.querySelector(`tr[data-project-id='${id}']`);
    if (!tr) return;

    // Desabilita o botão e mostra feedback
    buttonElement.disabled = true;
    buttonElement.textContent = 'Salvando...';
    tr.style.opacity = '0.7'; // Feedback visual

    const updateData = {};
    const fields = tr.querySelectorAll('[data-column]'); // Pega todos os campos com o atributo 'data-column'

    fields.forEach(field => {
        const coluna = field.getAttribute('data-column');
        let valor = field.value;

        // Trata o caso do índice numérico
        if (coluna === 'priority_index') {
            valor = parseInt(valor, 10);
            if (isNaN(valor)) valor = 999;
        }
        // Trata campos de data vazios
        if (field.type === 'date' && !valor) {
            valor = null;
        }

        updateData[coluna] = valor;
    });

    console.log("Enviando atualização:", updateData);

    const { error } = await supabaseClient
        .from('projetos')
        .update(updateData)
        .eq('id', id);

    // Reabilita o botão e remove feedback
    buttonElement.disabled = false;
    buttonElement.textContent = 'Salvar';
    tr.style.opacity = '1';

    if (error) {
        console.error("Erro ao salvar alterações:", error);
        alert(`Falha ao salvar as alterações do projeto. Verifique o console.`);
        // Feedback visual de erro (opcional)
        tr.style.outline = '2px solid red';
        setTimeout(() => { tr.style.outline = ''; }, 2000);
    } else {
        console.log("Projeto atualizado com sucesso!");
        // Feedback visual de sucesso
        tr.style.outline = '2px solid lightgreen';
        setTimeout(() => { tr.style.outline = ''; }, 1500);

        // Se o índice foi alterado, recarrega para reordenar
        if (updateData.hasOwnProperty('priority_index')) {
            carregarProjetos(true);
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

// REMOVIDO: A função 'handleEnterPress' não é mais necessária
// function handleEnterPress(event, id, coluna) { ... }

// REMOVIDO: Não precisamos mais expor 'atualizarCampo' ou 'handleEnterPress' globalmente
// window.atualizarCampo = atualizarCampo;
// window.handleEnterPress = handleEnterPress; 
window.deletarProjeto = deletarProjeto;
window.salvarAlteracoesProjeto = salvarAlteracoesProjeto; // NOVO: Expõe a função de salvar

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
