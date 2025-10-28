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
        if (error) {
             alert(error.message);
             // Re-enable button on error
             button.disabled = false; button.textContent = 'Entrar';
        }
        // Button is re-enabled by onAuthStateChange triggering UI reload
    });
}
async function logout() { await supabaseClient.auth.signOut(); }

// 4. Lógica de Controle de Estado (Admin vs. Público)
async function entrarModoAdmin(user) {
    usuarioLogado = user;
    authContainer.classList.add('hidden'); // Ensure login modal is hidden
    // Add try-catch for profile fetching
    let displayName = user.email; // Default to email
    try {
        const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
        // Ignore 'Row not found' error (PGRST116), log others
        if (profileError && profileError.code !== 'PGRST116') {
           console.error("Erro ao buscar perfil:", profileError);
        } else if (profile?.full_name) {
            displayName = profile.full_name;
        }
    } catch (e) {
        console.error("Exceção ao buscar perfil:", e);
    }

    headerAuthSection.innerHTML = `<span>Olá, ${displayName}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    // Add listener only if button exists
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) logoutButton.addEventListener('click', logout);

    // Formulário de Adição (com Prioridade)
    formWrapper.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form" style="display: flex; flex-wrap: wrap; row-gap: 1.2rem; column-gap: 2rem;">
                <div style="flex: 2 1 60%;"><label for="form-nome">Nome do Projeto:</label><input type="text" id="form-nome" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-responsavel">Responsável:</label><select id="form-responsavel" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="Sistema">Sistema</option><option value="BI">BI</option><option value="Infraestrutura">Infraestrutura</option><option value="Suporte">Suporte</option></select></div>
                <div style="flex: 1 1 30%;"><label for="form-chamado">Nº do Chamado:</label><input type="text" id="form-chamado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-solicitante">Solicitante:</label><input type="text" id="form-solicitante" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><label for="form-situacao">Situação Atual:</label><textarea id="form-situacao" style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea></div>
                <div style="flex: 1 1 30%;"><label for="form-prazo">Prazo:</label><input type="date" id="form-prazo" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-prioridade">Prioridade:</label><select id="form-prioridade" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="Alta">Alta</option><option value="Média" selected>Média</option><option value="Baixa">Baixa</option></select></div>
                <div style="flex: 1 1 100%;"><label for="form-priorizado">Priorizado Por:</label><input type="text" id="form-priorizado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Salvar Novo Projeto</button></div>
            </form>
        </div>`;
    // Add listener only if form exists
     const addForm = document.getElementById('add-project-form');
     if(addForm) addForm.addEventListener('submit', adicionarProjeto);

    if (actionsHeader) actionsHeader.style.display = 'table-cell';
    carregarProjetos(true); // Load projects *after* setting up the UI
}

function entrarModoPublico() {
    usuarioLogado = null;
    headerAuthSection.innerHTML = `<button id="login-button">Admin / Login</button>`;
    // Add listener only if button exists and ensure it's added only once
    const loginButton = document.getElementById('login-button');
    if (loginButton && !loginButton.dataset.listenerAttached) {
        loginButton.addEventListener('click', () => authContainer.classList.remove('hidden'));
        loginButton.dataset.listenerAttached = 'true';
    }
    formWrapper.innerHTML = '';
    if (actionsHeader) actionsHeader.style.display = 'none';
    carregarProjetos(false);
}

// 5. Funções do Gerenciador de Projetos (CRUD)

// REMOVIDO: Helper priorityOrder não era usado na versão funcional para query
// const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3, '': 4 };

async function carregarProjetos(isAdmin) {
    // Colspan correto (10 admin, 9 público)
    const colspan = isAdmin ? 11 : 10;
    const projectListTbody = document.getElementById('project-list');
    if (!projectListTbody) {
         console.error("Elemento tbody#project-list não encontrado!");
         return;
    }
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    // ===== ORDENAÇÃO CORRIGIDA =====
    query = query.order('priority_index', { ascending: true, nullsFirst: false });

    const { data: projetos, error } = await query; // Use 'projetos' diretamente

    if (error) {
        console.error("Erro ao carregar projetos:", error);
        projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o console.</td></tr>`;
        return;
    }

    // REMOVIDA A ORDENAÇÃO JS DA VERSÃO FUNCIONAL:
    // const projetos = projetosData.sort(...)

    if (!projetos || projetos.length === 0) {
        projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado para o filtro "${filtroAtual}".</td></tr>`;
        return;
    }

    projectListTbody.innerHTML = '';
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = p.id;

        if (isAdmin) {
            // Mantém 'prioridade', 'priority_index' como input number, botão salvar
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td><select data-column="responsavel"><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option><option value="Infraestrutura" ${p.responsavel === 'Infraestrutura' ? 'selected' : ''}>Infraestrutura</option><option value="Suporte" ${p.responsavel === 'Suporte' ? 'selected' : ''}>Suporte</option></select></td>
                <td><input type="text" data-column="chamado" value="${p.chamado||''}"/></td>
                <td><input type="text" data-column="solicitante" value="${p.solicitante||''}"/></td>
                <td><textarea data-column="situacao">${p.situacao||''}</textarea></td>
                <td><input type="date" data-column="prazo" value="${p.prazo||''}" /></td>
                <td><select data-column="prioridade"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                <td><input type="number" data-column="priority_index" value="${p.priority_index===null ? '' : p.priority_index}" style="width: 60px; text-align: center;"/></td>
                <td><input type="text" data-column="priorizado" value="${p.priorizado||''}"/></td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                        <button onclick="salvarAlteracoesProjeto(${p.id}, this)" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;">Salvar</button>
                        <button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;">Excluir</button>
                    </div>
                </td>`;
        } else {
             // Visão Pública (mantém 'prioridade' e 'priority_index')
            tr.innerHTML = `
                <td>${p.nome||''}</td>
                <td>${p.responsavel||''}</td>
                <td>${p.chamado||''}</td>
                <td>${p.solicitante||''}</td>
                <td>${p.situacao||''}</td>
                <td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td>
                <td>${p.prioridade||''}</td>
                <td>${p.priority_index ?? ''}</td>
                <td>${p.priorizado||''}</td>
                <td></td>`; // Célula vazia para coluna Ações
        }
        projectListTbody.appendChild(tr);
    });
}

async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');

    const form = event.target;
    // Mantém 'prioridade', não envia 'priority_index' (usa default DB)
    const formData = {
        nome: form.querySelector('#form-nome').value,
        chamado: form.querySelector('#form-chamado').value,
        situacao: form.querySelector('#form-situacao').value,
        prazo: form.querySelector('#form-prazo').value || null,
        responsavel: form.querySelector('#form-responsavel').value,
        solicitante: form.querySelector('#form-solicitante').value,
        prioridade: form.querySelector('#form-prioridade').value, // Mantido
        priorizado: form.querySelector('#form-priorizado').value,
        user_id: user.id
    };

    if (!formData.nome) { alert('O nome do projeto é obrigatório.'); return; }
    const { error } = await supabaseClient.from('projetos').insert([formData]);
    if (error) { console.error("Erro ao adicionar projeto:", error); alert('Falha ao adicionar projeto.'); }
    else { form.reset(); carregarProjetos(true); }
}

async function salvarAlteracoesProjeto(id, buttonElement) {
    const tr = document.querySelector(`tr[data-project-id='${id}']`);
    if (!tr) return;

    buttonElement.disabled = true; buttonElement.textContent = 'Salvando...'; tr.style.opacity = '0.7';

    const updateData = {};
    const fields = tr.querySelectorAll('[data-column]');

    fields.forEach(field => {
        const coluna = field.getAttribute('data-column');
        let valor = field.value;

        // Trata índice, usa 999 se inválido ou vazio
        if (coluna === 'priority_index') {
            valor = parseInt(valor, 10);
            if (isNaN(valor) || valor === null || valor === '') valor = 999;
        }
        if (field.type === 'date' && !valor) { valor = null; }
        updateData[coluna] = valor;
    });

    const { error } = await supabaseClient.from('projetos').update(updateData).eq('id', id);

    buttonElement.disabled = false; buttonElement.textContent = 'Salvar'; tr.style.opacity = '1';

    if (error) {
        console.error("Erro ao salvar alterações:", error);
        alert(`Falha ao salvar as alterações do projeto.`);
        tr.style.outline = '2px solid red'; setTimeout(() => { tr.style.outline = ''; }, 2000);
    } else {
        tr.style.outline = '2px solid lightgreen'; setTimeout(() => { tr.style.outline = ''; }, 1500);
        // Recarrega se o índice foi alterado (para reordenar)
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

// Funções expostas globalmente
window.deletarProjeto = deletarProjeto;
window.salvarAlteracoesProjeto = salvarAlteracoesProjeto;

function setupFiltros() {
    const botoes = document.querySelectorAll('.filter-btn');
    botoes.forEach(botao => {
        // Evita adicionar múltiplos listeners
        if (botao.dataset.listenerAttached !== 'true') {
             botao.addEventListener('click', () => {
                botoes.forEach(b => b.classList.remove('active'));
                botao.classList.add('active');
                filtroAtual = botao.textContent;
                const isAdmin = !!usuarioLogado;
                carregarProjetos(isAdmin);
            });
            botao.dataset.listenerAttached = 'true';
        }
    });
}

// Variável para rastrear o ID do usuário atualmente exibido na UI
let currentUserId = null;
let initialLoadComplete = false; // Flag para a lógica do onAuthStateChange

// 6. PONTO DE PARTIDA DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Carregado. Configurando listeners e verificando sessão...");
    setupAuthListeners();
    setupFiltros(); // Chama para configurar os filtros que já existem no HTML

    // Listener para mudanças de estado de autenticação
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        console.log("Auth Event:", _event, "Session:", session);
        const newUserId = session?.user?.id ?? null;

        // Lógica aprimorada para evitar recargas desnecessárias
        // Só recarrega se o usuário mudou OU se é a carga inicial e ainda não foi completada
        if (newUserId !== currentUserId || !initialLoadComplete) {
            console.log('Auth state change requires UI reload. Event:', _event);
            currentUserId = newUserId; // Atualiza quem está logado

            if (session && session.user) {
                // É crucial esperar a UI ser montada antes de carregar dados
                await entrarModoAdmin(session.user);
            } else {
                entrarModoPublico();
            }
             // Garante que os filtros sejam reconfigurados após a UI ser (re)desenhada
             setupFiltros();
            initialLoadComplete = true; // Marca que a primeira carga/mudança válida foi feita
        } else {
            console.log('Auth state event ignored (user unchanged or initial load already handled):', _event);
        }
    });

    // Verificação inicial explícita após configurar o listener
    // Isso garante que a primeira renderização aconteça
    try {
        const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
        console.log("Sessão inicial verificada:", initialSession);
        // A lógica dentro do onAuthStateChange ('INITIAL_SESSION') cuidará da renderização inicial
    } catch (e) {
        console.error("Erro ao obter sessão inicial:", e);
        // Pode ser necessário chamar entrarModoPublico() aqui em caso de erro grave
        entrarModoPublico(); // Garante uma renderização mesmo se getSession falhar
        initialLoadComplete = true; // Marca como completo para evitar loop
    }

});

window.deletarProjeto = deletarProjeto;
window.handleEnterPress = handleEnterPress;
