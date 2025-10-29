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
let currentUserId = null; // Mantém para a lógica do onAuthStateChange
let initialLoadComplete = false; // Mantém para a lógica do onAuthStateChange

// ===== MAPEAMENTO EMAIL -> RESPONSÁVEL (JÁ EXISTENTE) =====
const emailResponsavelMap = {
    'lucasbarros@garbuio.com.br': 'BI',
    'guilhermemachancoses@garbuio.com.br': 'Sistema',
    'joaocosta@garbuio.com.br': 'Suporte',
    'lucaslembis@garbuio.com.br': 'Infraestrutura',
    'brunorissio@garbuio.com.br': null // Valor null indica que ele pode escolher (ou não é um responsável fixo?)
};
// =============================================================


// 3. Funções e Lógica de Autenticação
function setupAuthListeners() {
    // Garante listeners únicos
    const closeButton = document.getElementById('close-login-button');
    if (closeButton && !closeButton.dataset.listenerAttached) {
        closeButton.addEventListener('click', () => { authContainer.classList.add('hidden'); });
        closeButton.dataset.listenerAttached = 'true';
    }
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
                 button.disabled = false; button.textContent = 'Entrar';
            }
            // UI recarrega via onAuthStateChange
        });
        authForm.dataset.listenerAttached = 'true';
    }
}
async function logout() { await supabaseClient.auth.signOut(); }

// 4. Lógica de Controle de Estado (Admin vs. Público)
async function entrarModoAdmin(user) {
    console.log("Entrando Modo Admin..."); // Log
    usuarioLogado = user;
    authContainer.classList.add('hidden');
    let displayName = user.email;
    try {
        const { data: profile, error } = await supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') { console.error("Erro perfil:", error); }
        displayName = profile?.full_name || user.email;
    } catch (e) { console.error("Exceção ao buscar perfil:", e); }

    headerAuthSection.innerHTML = `<span>Olá, ${displayName}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    const logoutButton = document.getElementById('logout-button');
    logoutButton?.removeEventListener('click', logout); // Evita duplicar listener
    logoutButton?.addEventListener('click', logout);

    // Formulário de Adição (IDÊNTICO AO SEU FUNCIONAL, COM VALOR PADRÃO RESPONSÁVEL)
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

     // --- LÓGICA DO VALOR PADRÃO ---
     const defaultResponsavel = emailResponsavelMap[user.email];
     const responsavelSelect = document.getElementById('form-responsavel');
     if (responsavelSelect) {
        if (defaultResponsavel !== null) { // !== null para o Bruno
            responsavelSelect.value = defaultResponsavel;
            // Desabilita se não for o Bruno
            if (user.email !== 'brunorissio@garbuio.com.br') {
                responsavelSelect.disabled = true;
            } else {
                 responsavelSelect.disabled = false; // Garante que esteja habilitado para o Bruno
            }
        } else {
             responsavelSelect.disabled = false; // Habilitado para o Bruno
        }
     }
     // --- FIM DA LÓGICA DO VALOR PADRÃO ---

     const addForm = document.getElementById('add-project-form');
     if (addForm && !addForm.dataset.listenerAttached) {
         addForm.addEventListener('submit', adicionarProjeto);
         addForm.dataset.listenerAttached = 'true';
     }

    if (actionsHeader) actionsHeader.style.display = 'table-cell';
    await carregarProjetos(true);
}

function entrarModoPublico() {
    console.log("Entrando Modo Público..."); // Log
    usuarioLogado = null;
    headerAuthSection.innerHTML = `<button id="login-button">Admin / Login</button>`;
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

async function carregarProjetos(isAdmin) {
    const colspan = 11; // Sempre 11 colunas no total agora
    const projectListTbody = document.getElementById('project-list');
    if (!projectListTbody) { console.error("tbody#project-list não encontrado!"); return; }
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    // Busca os projetos com filtro e ORDENAÇÃO POR ÍNDICE
    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    query = query.order('priority_index', { ascending: true, nullsFirst: false }); // Ordena SÓ pelo índice

    const { data: projetos, error } = await query;

    if (error) {
        console.error("Erro ao carregar projetos:", error);
        projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`;
        return;
    }

    if (!projetos || projetos.length === 0) {
        projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado para o filtro "${filtroAtual}".</td></tr>`;
        return;
    }

    projectListTbody.innerHTML = '';

    // Determina o papel do usuário logado ANTES do loop
    const currentUserResponsavel = usuarioLogado ? emailResponsavelMap[usuarioLogado.email] : null;
    const isBruno = usuarioLogado && usuarioLogado.email === 'brunorissio@garbuio.com.br';

    projetos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = p.id;

        // Determina se a linha atual pode ser editada pelo usuário logado
        const isOwner = usuarioLogado && usuarioLogado.id === p.user_id;
        const isResponsible = usuarioLogado && currentUserResponsavel === p.responsavel;
        // Regra de Edição: Admin E (Criador OU Responsável OU Bruno)
        const canEditRow = isAdmin && usuarioLogado && (isOwner || isResponsible || isBruno);

        if (isAdmin) {
            // Define o atributo 'disabled' baseado na permissão
            const fieldsDisabled = !canEditRow ? 'disabled' : '';
            // Define se o botão Excluir estará habilitado (só para o dono)
            const deleteDisabled = !isOwner ? 'disabled' : '';
             // Define se o botão Salvar estará habilitado
            const saveDisabled = !canEditRow ? 'disabled' : '';


            tr.innerHTML = `
                <td>${p.nome}</td>
                {/* O select de Responsável fica sempre habilitado para admins? Ou só Bruno/Criador? Vamos deixar habilitado para todos os admins por enquanto */}
                <td><select data-column="responsavel"><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option><option value="Infraestrutura" ${p.responsavel === 'Infraestrutura' ? 'selected' : ''}>Infraestrutura</option><option value="Suporte" ${p.responsavel === 'Suporte' ? 'selected' : ''}>Suporte</option></select></td>
                <td><input type="text" data-column="chamado" value="${p.chamado||''}" ${fieldsDisabled}/></td>
                <td><input type="text" data-column="solicitante" value="${p.solicitante||''}" ${fieldsDisabled}/></td>
                <td><textarea data-column="situacao" ${fieldsDisabled}>${p.situacao||''}</textarea></td>
                <td><input type="date" data-column="prazo" value="${p.prazo||''}" ${fieldsDisabled}/></td>
                <td><select data-column="prioridade" ${fieldsDisabled}><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                {/* O Índice fica sempre habilitado para admins? Sim. */}
                <td><input type="number" data-column="priority_index" value="${p.priority_index===null ? '' : p.priority_index}" style="width: 60px; text-align: center;"/></td>
                <td><input type="text" data-column="priorizado" value="${p.priorizado||''}" ${fieldsDisabled}/></td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                        {/* Aplica o 'disabled' aos botões */}
                        <button onclick="salvarAlteracoesProjeto(${p.id}, this)" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;" ${saveDisabled}>Salvar</button>
                        <button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;" ${deleteDisabled}>Excluir</button>
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
    // ALTERADO: Usa 'null' como default para priority_index se vazio/inválido
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
        // priority_index usará o default NULL do banco
    };

    if (!formData.nome) { alert('O nome do projeto é obrigatório.'); return; }
    const { error } = await supabaseClient.from('projetos').insert([formData]);
    if (error) { console.error(error); alert('Falha ao adicionar projeto.'); } else { form.reset(); carregarProjetos(true); }
}

async function salvarAlteracoesProjeto(id, buttonElement) {
    const tr = document.querySelector(`tr[data-project-id='${id}']`);
    if (!tr) return;
    if (buttonElement.disabled) return; // Não faz nada se o botão estiver desabilitado

    buttonElement.disabled = true; buttonElement.textContent = 'Salvando...'; tr.style.opacity = '0.7';

    const updateData = {};
    // Pega APENAS os campos editáveis (NÃO desabilitados)
    const fields = tr.querySelectorAll('[data-column]:not([disabled])');

    fields.forEach(field => {
        const coluna = field.getAttribute('data-column');
        let valor = field.value;

        // ALTERADO: Usa 'null' como fallback para índice
        if (coluna === 'priority_index') {
            valor = parseInt(valor, 10);
            if (isNaN(valor) || valor === null || valor === '') valor = null; // Usa null como fallback
        }
        if (field.type === 'date' && !valor) { valor = null; }
        updateData[coluna] = valor;
    });

    // Se nenhum campo editável foi selecionado, não faz nada
    if (Object.keys(updateData).length === 0) {
        console.log("Nenhum campo editável para salvar.");
        buttonElement.disabled = false; buttonElement.textContent = 'Salvar'; tr.style.opacity = '1';
        return;
    }

    console.log("Salvando alterações:", updateData);
    const { error } = await supabaseClient.from('projetos').update(updateData).eq('id', id);

    buttonElement.disabled = false; buttonElement.textContent = 'Salvar'; tr.style.opacity = '1';

    if (error) {
        console.error("Erro ao salvar alterações:", error);
        alert(`Falha ao salvar as alterações do projeto.`);
        tr.style.outline = '2px solid red'; setTimeout(() => { tr.style.outline = ''; }, 2000);
    } else {
        tr.style.outline = '2px solid lightgreen'; setTimeout(() => { tr.style.outline = ''; }, 1500);
        // Recarrega se o índice foi alterado
        if (updateData.hasOwnProperty('priority_index')) {
            carregarProjetos(true);
        }
    }
}

async function deletarProjeto(id, nome) {
    // A verificação visual (botão disabled) já acontece em carregarProjetos
    // Mas mantemos a segurança RLS no backend.
    if (confirm(`Tem certeza que deseja excluir o projeto "${nome}"?`)) {
        const { error } = await supabaseClient.from('projetos').delete().eq('id', id);
        if (error) {
             console.error('Erro ao deletar projeto:', error);
             // Verifica se o erro é de permissão RLS
             if (error.message.includes('violates row-level security policy')) {
                 alert("Falha ao excluir: Você não tem permissão para deletar este projeto (provavelmente não é o criador).");
             } else {
                 alert('Falha ao excluir o projeto.');
             }
        }
        else { carregarProjetos(true); }
    }
}

// Funções expostas globalmente
window.deletarProjeto = deletarProjeto;
window.salvarAlteracoesProjeto = salvarAlteracoesProjeto;

function setupFiltros() {
    const botoes = document.querySelectorAll('.filter-btn');
    if (botoes.length > 0) {
        botoes.forEach(botao => {
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
    } else {
        console.warn("Botões de filtro não encontrados.");
    }
}

// 6. PONTO DE PARTIDA DA APLICAÇÃO (IDÊNTICO AO FUNCIONAL)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Carregado. Configurando listeners e verificando sessão...");
    setupAuthListeners();
    setupFiltros();

    try {
        const { data: { session: initialSession }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        currentUserId = initialSession?.user?.id ?? null;
        console.log('Sessão inicial verificada:', currentUserId ? 'Logado' : 'Deslogado');
        if (initialSession && initialSession.user) {
            await entrarModoAdmin(initialSession.user);
        } else {
            entrarModoPublico();
        }
        initialLoadComplete = true;
        setupFiltros();
    } catch (e) {
         console.error("Erro CRÍTICO na verificação inicial da sessão:", e);
         currentUserId = null;
         entrarModoPublico();
         setupFiltros();
         initialLoadComplete = true;
    }

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (_event === 'INITIAL_SESSION' && initialLoadComplete) { return; }
        console.log("onAuthStateChange Evento:", _event, "Session:", session ? "Exists" : "Null");
        const newUserId = session?.user?.id ?? null;
        if (newUserId !== currentUserId) {
            console.log('Mudança de usuário detectada, recarregando UI.');
            currentUserId = newUserId;
            if (session && session.user) {
                await entrarModoAdmin(session.user);
            } else {
                entrarModoPublico();
            }
            setupFiltros();
        } else {
            console.log('onAuthStateChange: Evento ignorado (usuário não mudou). Event:', _event);
        }
    });
});
