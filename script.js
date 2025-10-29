const emailResponsavelMap = {
    'lucasbarros@garbuio.com.br': 'BI',
    'guilhermemachancoses@garbuio.com.br': 'Sistema',
    'joaocosta@garbuio.com.br': 'Suporte',
    'lucaslembis@garbuio.com.br': 'Infraestrutura',
    'brunorissio@garbuio.com.br': null // Valor null indica que ele pode escolher
};
// =============================================================

let filtroAtual = 'Todos';
let usuarioLogado = null;
let currentUserId = null;
let initialLoadComplete = false;


const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

const { createClient } = supabase;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const headerAuthSection = document.getElementById('header-auth-section');
const formWrapper = document.getElementById('form-wrapper');
const actionsHeader = document.getElementById('actions-header');
let filtroAtual = 'Todos';
let usuarioLogado = null;
let currentUserId = null;
let initialLoadComplete = false; 

function setupAuthListeners() {
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
        });
        authForm.dataset.listenerAttached = 'true';
    }
}
async function logout() { await supabaseClient.auth.signOut(); }



async function entrarModoAdmin(user) {
    console.log("Entrando no Modo Admin para:", user.email);
    usuarioLogado = user; 
    authContainer.classList.add('hidden');
    let displayName = user.email;
    try {
        const { data: profile } = await supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
        displayName = profile?.full_name || user.email;
    } catch (e) { console.error("Exceção ao buscar perfil:", e); }

    headerAuthSection.innerHTML = `<span>Olá, ${displayName}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    const logoutButton = document.getElementById('logout-button');
    logoutButton?.removeEventListener('click', logout);
    logoutButton?.addEventListener('click', logout);

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

    const defaultResponsavel = emailResponsavelMap[user.email];
    const responsavelSelect = document.getElementById('form-responsavel');
    if (responsavelSelect && defaultResponsavel !== null) { 
        responsavelSelect.value = defaultResponsavel;

    }
     const addForm = document.getElementById('add-project-form');
     if (addForm && !addForm.dataset.listenerAttached) {
         addForm.addEventListener('submit', adicionarProjeto);
         addForm.dataset.listenerAttached = 'true';
     }

    if (actionsHeader) actionsHeader.style.display = 'table-cell';
    await carregarProjetos(true); 
}
function entrarModoPublico() {
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


async function carregarProjetos(isAdmin) {
    const colspan = isAdmin ? 11 : 10;
    const projectListTbody = document.getElementById('project-list');
    if (!projectListTbody) { console.error("tbody#project-list não encontrado!"); return; }
    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;

    let N = 0;
    try {
        let countQuery = supabaseClient.from('projetos').select('*', { count: 'exact', head: true });
        if (filtroAtual !== 'Todos') {
            countQuery = countQuery.eq('responsavel', filtroAtual); 
        }
        const { count: totalProjectCount, error: countError } = await countQuery;
        
        if (countError) throw countError;
        N = totalProjectCount > 0 ? totalProjectCount : 1; 
    } catch (e) {
        console.error("Erro ao contar projetos (pode afetar o select de índice):", e);
        const { count: fallbackCount } = await supabaseClient.from('projetos').select('*', { count: 'exact', head: true });
        N = fallbackCount > 0 ? fallbackCount : 1;
    }

    let query = supabaseClient.from('projetos').select('*');
    if (filtroAtual !== 'Todos') {
        query = query.eq('responsavel', filtroAtual);
    }
    query = query.order('priority_index', { ascending: true, nullsFirst: false });

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
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = p.id;
        
        let indexOptionsHtml = '';
        if (isAdmin) {
             const maxOption = Math.max(N, p.priority_index ?? 0); 
            for (let i = 1; i <= maxOption; i++) {
                 if (i === null && i > N) continue; 
                const isSelected = p.priority_index === i;
                indexOptionsHtml += `<option value="${i}" ${isSelected ? 'selected' : ''}>${i}</option>`;
            }
             const currentIndexValue = p.priority_index ?? null;
             if (currentIndexValue >= null && !indexOptionsHtml.includes(`value="null"`)) {
                indexOptionsHtml += `<option value="null" selected>null</option>`;
             } else if (currentIndexValue > N && currentIndexValue < null && !indexOptionsHtml.includes(`value="${currentIndexValue}"`)){
                  indexOptionsHtml += `<option value="${currentIndexValue}" selected>${currentIndexValue}</option>`;
             }
        }

        if (isAdmin) {
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
            tr.innerHTML = `<td>${p.nome||''}</td><td>${p.chamado||''}</td><td>${p.responsavel||''}</td><td>${p.solicitante||''}</td><td>${p.situacao||''}</td><td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td><td>${p.prioridade||''}</td><td>${p.priority_index ?? ''}</td><td>${p.priorizado||''}</td><td></td>`;
        }
        projectListTbody.appendChild(tr);
    });
}

async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');

    const form = event.target;
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

async function salvarAlteracoesProjeto(id, buttonElement) {
    const tr = document.querySelector(`tr[data-project-id='${id}']`);
    if (!tr) return;

    buttonElement.disabled = true; buttonElement.textContent = 'Salvando...'; tr.style.opacity = '0.7';

    const updateData = {};
    const fields = tr.querySelectorAll('[data-column]');

    fields.forEach(field => {
        const coluna = field.getAttribute('data-column');
        let valor = field.value;
        
        if (coluna === 'priority_index') {
            valor = parseInt(valor, 10);
            if (isNaN(valor) || valor === null || valor === '') valor = null;
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
        if (updateData.hasOwnProperty('priority_index') || updateData.hasOwnProperty('prioridade')) {
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

window.deletarProjeto = deletarProjeto;
window.salvarAlteracoesProjeto = salvarAlteracoesProjeto;

function setupFiltros() {
    const botoes = document.querySelectorAll('.filter-btn');
     if(botoes.length > 0) {
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

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Carregado. Configurando listeners e verificando sessão...");
    setupAuthListeners();
    setupFiltros();

    const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
    currentUserId = initialSession?.user?.id ?? null;
    if (initialSession && initialSession.user) {
        console.log('Initial load: User is logged in.');
        await entrarModoAdmin(initialSession.user);
    } else {
        console.log('Initial load: User is logged out.');
        entrarModoPublico();
    }
    initialLoadComplete = true;
    setupFiltros();

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (_event === 'INITIAL_SESSION') {
            console.log('Auth event: INITIAL_SESSION ignored.');
            return;
        }
        const newUserId = session?.user?.id ?? null;
        if (newUserId !== currentUserId) {
            console.log('Auth state changed:', _event, ' New user ID:', newUserId);
            currentUserId = newUserId;
            if (session && session.user) {
                await entrarModoAdmin(session.user);
            } else {
                entrarModoPublico();
            }
            setupFiltros();
        } else {
            console.log('Auth state event ignored (user unchanged):', _event);
        }
    });
});
