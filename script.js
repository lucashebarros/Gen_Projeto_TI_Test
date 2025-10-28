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
let usuarioLogado = null; // Usado para saber se é admin em carregarProjetos
let currentUserId = null; // Usado para rastrear mudanças no onAuthStateChange

// 3. Funções e Lógica de Autenticação
function setupAuthListeners() {
    // Garante que o listener só é adicionado uma vez
    const closeButton = document.getElementById('close-login-button');
    if (closeButton && !closeButton.dataset.listenerAttached) {
        closeButton.addEventListener('click', () => { authContainer.classList.add('hidden'); });
        closeButton.dataset.listenerAttached = 'true';
    }
    // Garante que o listener só é adicionado uma vez
    if (authForm && !authForm.dataset.listenerAttached) {
        authForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const button = authForm.querySelector('button');
            button.disabled = true; button.textContent = 'Aguarde...';
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                alert(error.message);
                button.disabled = false; button.textContent = 'Entrar'; // Reabilita em caso de erro
            }
            // Não precisa reabilitar em caso de sucesso, a UI será recarregada
        });
        authForm.dataset.listenerAttached = 'true';
    }
}
async function logout() { await supabaseClient.auth.signOut(); }

// 4. Lógica de Controle de Estado (Admin vs. Público)
async function entrarModoAdmin(user) {
    console.log("Entrando no Modo Admin para:", user.email);
    usuarioLogado = user; // Atualiza estado global
    authContainer.classList.add('hidden');
    let displayName = user.email;
    try {
        const { data: profile, error } = await supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') { console.error("Erro ao buscar perfil:", error); }
        displayName = profile?.full_name || user.email;
    } catch (e) { console.error("Exceção ao buscar perfil:", e); }

    headerAuthSection.innerHTML = `<span>Olá, ${displayName}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    const logoutButton = document.getElementById('logout-button');
    // Remove listener antigo (se houver) e adiciona novo para evitar duplicação
    logoutButton?.removeEventListener('click', logout);
    logoutButton?.addEventListener('click', logout);


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
    // Add listener only if form exists and hasn't been added before
    const addForm = document.getElementById('add-project-form');
    if (addForm && !addForm.dataset.listenerAttached) {
         addForm.addEventListener('submit', adicionarProjeto);
         addForm.dataset.listenerAttached = 'true';
    }

    if (actionsHeader) actionsHeader.style.display = 'table-cell';
    carregarProjetos(true); // Carrega os projetos para o modo admin
}

function entrarModoPublico() {
    console.log("Entrando no Modo Público.");
    usuarioLogado = null; // Atualiza estado global
    headerAuthSection.innerHTML = `<button id="login-button">Admin / Login</button>`;
    // Add listener only if button exists and hasn't been added before
    const loginButton = document.getElementById('login-button');
    if (loginButton && !loginButton.dataset.listenerAttached) {
        loginButton.addEventListener('click', () => authContainer.classList.remove('hidden'));
        loginButton.dataset.listenerAttached = 'true';
    }
    formWrapper.innerHTML = ''; // Limpa o formulário de adição
    if (actionsHeader) actionsHeader.style.display = 'none';
    carregarProjetos(false); // Carrega os projetos para o modo público
}

// 5. Funções do Gerenciador de Projetos (CRUD)

// REMOVIDO: Helper priorityOrder não é mais necessário para ordenação JS
// const priorityOrder = { ... };

async function carregarProjetos(isAdmin) {
    console.log(`Carregando projetos (isAdmin: ${isAdmin}, filtro: ${filtroAtual})...`);
    // Colspan correto (10 admin, 9 público)
    const colspan = isAdmin ? 11 : 10;
    const projectListTbody = document.getElementById('project-list');
    if (!projectListTbody) {
         console.error("ERRO CRÍTICO: tbody#project-list não encontrado ao carregar projetos!");
         return;
    }
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    // 1. Busca o TOTAL de projetos para saber o N do select de ÍNDICE (só necessário no modo admin)
    let N = 1; // Default
    if (isAdmin) {
        const { count: totalProjectCount, error: countError } = await supabaseClient
            .from('projetos')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.error("Erro ao contar projetos:", countError);
            // Não interrompe, mas o select pode ficar limitado
        } else {
             N = totalProjectCount > 0 ? totalProjectCount : 1;
        }
         console.log("Total de projetos para select:", N);
    }


    // 2. Busca os projetos APLICANDO O FILTRO e ORDENANDO APENAS pelo índice
    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    // ===== ORDENAÇÃO CORRIGIDA =====
    query = query.order('priority_index', { ascending: true, nullsFirst: false });

    const { data: projetos, error: fetchError } = await query;

    if (fetchError) {
        console.error("Erro ao buscar projetos:", fetchError);
        projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o console.</td></tr>`;
        return;
    }

    console.log("Projetos recebidos:", projetos ? projetos.length : 0);

    // REMOVIDA A ORDENAÇÃO JS

    if (!projetos || projetos.length === 0) {
        projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado para o filtro "${filtroAtual}".</td></tr>`;
        return;
    }

    projectListTbody.innerHTML = ''; // Limpa o "Carregando..."
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = p.id;

        // Gera as opções para o <select> do ÍNDICE (só se for admin)
        let indexOptionsHtml = '';
        if (isAdmin) {
            for (let i = 1; i <= N; i++) {
                const isSelected = p.priority_index === i;
                indexOptionsHtml += `<option value="${i}" ${isSelected ? 'selected' : ''}>${i}</option>`;
            }
             // Adiciona 999 se necessário e se não estiver já no loop 1 a N
            if ((p.priority_index === null || p.priority_index === 999 || p.priority_index > N) && N < 999 ) {
                 const currentVal = p.priority_index ?? 999;
                 // Evita adicionar 999 duas vezes se N=999
                 if (!indexOptionsHtml.includes(`value="999"`)) {
                    indexOptionsHtml += `<option value="999" ${currentVal === 999 ? 'selected' : ''}>999</option>`;
                 } else if (currentVal > N && currentVal !== 999) {
                     // Adiciona o valor exato se for > N e não 999
                     indexOptionsHtml += `<option value="${currentVal}" selected>${currentVal}</option>`;
                 }
            } else if (p.priority_index > N && p.priority_index !== 999) {
                 indexOptionsHtml += `<option value="${p.priority_index}" selected>${p.priority_index}</option>`;
            }
        }


        if (isAdmin) {
            // Tabela Admin (com Prioridade e Índice Select)
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td><select data-column="responsavel"><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option><option value="Infraestrutura" ${p.responsavel === 'Infraestrutura' ? 'selected' : ''}>Infraestrutura</option><option value="Suporte" ${p.responsavel === 'Suporte' ? 'selected' : ''}>Suporte</option></select></td>
                <td><input type="text" data-column="chamado" value="${p.chamado||''}"/></td>
                <td><input type="text" data-column="solicitante" value="${p.solicitante||''}"/></td>
                <td><textarea data-column="situacao">${p.situacao||''}</textarea></td>
                <td><input type="date" data-column="prazo" value="${p.prazo||''}" /></td>
                <td><select data-column="prioridade"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                <td>
                   <select data-column="priority_index" style="width: 70px; text-align: center;">
                       ${indexOptionsHtml}
                   </select>
                </td>
                <td><input type="text" data-column="priorizado" value="${p.priorizado||''}"/></td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                        <button onclick="salvarAlteracoesProjeto(${p.id}, this)" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;">Salvar</button>
                        <button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;">Excluir</button>
                    </div>
                </td>`;
        } else {
             // Visão Pública (com Prioridade e Índice)
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
     console.log("Renderização da tabela concluída.");
}

async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');

    const form = event.target;
    // Mantém 'prioridade', usa default do DB para 'priority_index'
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

        // Trata índice (usa 999 se inválido/vazio)
        if (coluna === 'priority_index') {
            valor = parseInt(valor, 10);
            if (isNaN(valor) || valor === null || valor === '') valor = 999;
        }
        if (field.type === 'date' && !valor) { valor = null; }
        updateData[coluna] = valor;
    });

    console.log("Salvando alterações:", updateData); // Log para depuração
    const { error } = await supabaseClient.from('projetos').update(updateData).eq('id', id);

    buttonElement.disabled = false; buttonElement.textContent = 'Salvar'; tr.style.opacity = '1';

    if (error) {
        console.error("Erro ao salvar alterações:", error);
        alert(`Falha ao salvar as alterações do projeto. Verifique o console.`);
        tr.style.outline = '2px solid red'; setTimeout(() => { tr.style.outline = ''; }, 2000);
    } else {
        console.log("Alterações salvas com sucesso!");
        tr.style.outline = '2px solid lightgreen'; setTimeout(() => { tr.style.outline = ''; }, 1500);
        // Recarrega se o índice foi alterado (para reordenar)
        if (updateData.hasOwnProperty('priority_index')) {
            console.log("Índice alterado, recarregando tabela para reordenar.");
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
        // Garante que só adiciona o listener uma vez
        if (botao.dataset.listenerAttached !== 'true') {
             botao.addEventListener('click', () => {
                botoes.forEach(b => b.classList.remove('active'));
                botao.classList.add('active');
                filtroAtual = botao.textContent;
                const isAdmin = !!usuarioLogado; // Verifica se está logado para passar para carregarProjetos
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
let initialLoadComplete = false; // Flag para a lógica do onAuthStateChange

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Carregado. Configurando listeners e verificando sessão...");
    setupAuthListeners();
    setupFiltros(); // Chama para configurar os filtros que já existem no HTML

    // Listener para mudanças de estado de autenticação
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        console.log("Auth Event:", _event, "Session:", session ? "Exists" : "Null");
        const newUserId = session?.user?.id ?? null;

        // Lógica aprimorada para evitar recargas desnecessárias
        if ((_event === 'INITIAL_SESSION' || _event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') && newUserId === currentUserId && initialLoadComplete) {
            console.log('Auth state event ignored (user unchanged or already loaded):', _event);
            // Mesmo se ignorar, garante que os filtros sejam reconfigurados se a UI foi recriada (caso raro)
             if(document.querySelectorAll('.filter-btn').length > 0 && !document.querySelector('.filter-btn').dataset.listenerAttached) setupFiltros();
            return;
        }
        if (_event === 'SIGNED_OUT' && newUserId === null && currentUserId === null && initialLoadComplete) {
             console.log('Auth state event ignored (already logged out):', _event);
             return;
        }

        console.log('Auth state change requires UI reload. Event:', _event, ' Current User:', currentUserId, ' New User:', newUserId);
        // --- CORREÇÃO: Apenas atribui, não re-declara ---
        currentUserId = newUserId;

        if (session && session.user) {
            // Garante que a função termine antes de continuar
            await entrarModoAdmin(session.user);
        } else {
            entrarModoPublico();
        }
        initialLoadComplete = true; // Marca que a primeira carga/mudança válida foi feita
        // Garante que os filtros sejam reconfigurados após a UI ser (re)desenhada
         setupFiltros();
    });

    // Verificação inicial explícita - Pode ser redundante com INITIAL_SESSION, mas adiciona robustez
    try {
        // Verifica se a carga inicial já foi feita pelo onAuthStateChange antes de forçar
        if (!initialLoadComplete) {
            console.log("Verificando sessão inicial via getSession...");
            const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
            console.log("Sessão inicial (getSession):", initialSession ? "Exists" : "Null");

            // Só executa se initialLoadComplete AINDA for false
            if (!initialLoadComplete) {
                 const initialUserId = initialSession?.user?.id ?? null;
                 // --- CORREÇÃO: Apenas atribui, não re-declara ---
                 currentUserId = initialUserId; // Define o ID inicial

                if (initialSession && initialSession.user) {
                    console.log("Forçando render inicial Admin via getSession");
                    await entrarModoAdmin(initialSession.user);
                } else {
                    console.log("Forçando render inicial Público via getSession");
                    entrarModoPublico();
                }
                setupFiltros();
                initialLoadComplete = true; // Marca como completo após render forçado
            } else {
                 console.log("Render inicial já tratado pelo onAuthStateChange.");
            }
        } else {
             console.log("Carga inicial já completa, getSession não forçará render.");
        }
    } catch (e) {
        console.error("Erro ao obter sessão inicial:", e);
        // Garante renderização pública em caso de erro grave na inicialização
        if (!initialLoadComplete) {
            currentUserId = null;
            entrarModoPublico();
            setupFiltros();
            initialLoadComplete = true;
        }
    }
});

// REMOVIDAS as referências globais que não estão definidas ou não são necessárias
// window.atualizarCampo = atualizarCampo; // Esta função não existe mais globalmente
// window.handleEnterPress = handleEnterPress; // Esta função foi removida

// Mantém as que são usadas pelo HTML
window.deletarProjeto = deletarProjeto;
window.salvarAlteracoesProjeto = salvarAlteracoesProjeto;
