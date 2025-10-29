const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';



const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';



const { createClient } = supabase;



const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



const authContainer = document.getElementById('auth-container');

const authForm = document.getElementById('auth-form');

const headerAuthSection = document.getElementById('header-auth-section');

const formWrapper = document.getElementById('form-wrapper');

const actionsHeader = document.getElementById('actions-header');



const emailResponsavelMap = {

    'lucasbarros@garbuio.com.br': 'BI',

    'guilhermemachancoses@garbuio.com.br': 'Sistema',

    'joaocosta@garbuio.com.br': 'Suporte',

    'lucaslembis@garbuio.com.br': 'Infraestrutura',

    'brunorissio@garbuio.com.br': null 

};





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





// ARQUIVO: script.js (Substitua esta função)



async function carregarProjetos(isAdmin) {

    console.log(`Carregando projetos (isAdmin: ${isAdmin}, filtro: ${filtroAtual})...`);

    const colspan = isAdmin ? 11 : 10;

    const projectListTbody = document.getElementById('project-list');

    if (!projectListTbody) { console.error("ERRO CRÍTICO: tbody#project-list não encontrado!"); return; }

    projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando projetos...</td></tr>`;



    // 1. Busca contagem (só admin)

    let N = 1;

    if (isAdmin) {

        try {

            const { count, error } = await supabaseClient.from('projetos').select('*', { count: 'exact', head: true });

            if (error) throw error;

            N = count > 0 ? count : 1;

        } catch(e) { console.error("Erro ao contar projetos:", e); }

    }



    // 2. Busca projetos com filtro e ordenação por índice

    let query = supabaseClient.from('projetos').select('*');

    if (filtroAtual !== 'Todos') {

        query = query.eq('responsavel', filtroAtual);

    }

    query = query.order('priority_index', { ascending: true, nullsFirst: false });



    const { data: projetos, error: fetchError } = await query;



    if (fetchError) { console.error("Erro ao buscar projetos:", fetchError); projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">Erro ao carregar.</td></tr>`; return; }

    if (!projetos || projetos.length === 0) { projectListTbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhum projeto encontrado.</td></tr>`; return; }



    projectListTbody.innerHTML = '';

    

    // ===== NOVO: Determina o responsável do usuário logado ANTES do loop =====

    const currentUserResponsavel = usuarioLogado ? emailResponsavelMap[usuarioLogado.email] : null;

    // ======================================================================



    projetos.forEach(p => {

        const tr = document.createElement('tr');

        tr.dataset.projectId = p.id;



        // ===== NOVO: Verifica se a linha é editável =====

        // Editável se for admin E (o usuário logado é o criador OU o usuário logado é o responsável)

        // A regra RLS do Supabase (auth.uid = user_id) ainda protege no backend.

        const isOwner = usuarioLogado && usuarioLogado.id === p.user_id;

        const isResponsible = usuarioLogado && currentUserResponsavel === p.responsavel;

        const canEditThisRow = isAdmin && (isOwner || isResponsible || currentUserResponsavel === null); // currentUserResponsavel === null é o Bruno? Melhor checar email.

        // const canEditThisRow = isAdmin && usuarioLogado && (usuarioLogado.id === p.user_id || emailResponsavelMap[usuarioLogado.email] === p.responsavel || usuarioLogado.email === 'brunorissio@garbuio.com.br'); // Bruno pode editar tudo? Ou só se for o responsável? Vamos manter a regra: só edita se for o responsável OU o criador. Bruno só edita se for o responsável.

        const canEditRow = isAdmin && usuarioLogado && (usuarioLogado.id === p.user_id || currentUserResponsavel === p.responsavel); // Simplificado: Criador OU Responsável podem editar

        const isBruno = usuarioLogado && usuarioLogado.email === 'brunorissio@garbuio.com.br'; // Caso especial Bruno



        // Gera as opções para o <select> do ÍNDICE

        let indexOptionsHtml = '';

         if (isAdmin) { // Só gera se for admin, otimização

             const maxOption = Math.max(N, p.priority_index ?? 0);

            for (let i = 1; i <= maxOption; i++) {

                 if (i === 999 && i > N) continue;

                const isSelected = p.priority_index === i;

                indexOptionsHtml += `<option value="${i}" ${isSelected ? 'selected' : ''}>${i}</option>`;

            }

             const currentIndexValue = p.priority_index ?? 999;

             if (currentIndexValue >= 999 && !indexOptionsHtml.includes(`value="999"`)) {

                indexOptionsHtml += `<option value="999" selected>999</option>`;

             } else if (currentIndexValue > N && currentIndexValue < 999 && !indexOptionsHtml.includes(`value="${currentIndexValue}"`)){

                  indexOptionsHtml += `<option value="${currentIndexValue}" selected>${currentIndexValue}</option>`;

             }

        }





        if (isAdmin) {

             // Define se os campos estarão desabilitados

             // Permitimos editar o Responsável para todos os admins (ou só criador/Bruno?) - Vamos permitir para todos por enquanto.

             // Permitimos editar o Índice para todos os admins? Sim.

             const fieldsDisabled = !canEditRow ? 'disabled' : '';

             const indexDisabled = ''; // Índice sempre editável por admins? Sim.

             const responsavelDisabled = ''; // Responsável sempre editável por admins? Sim.





            tr.innerHTML = `

                <td>${p.nome}</td>

                <td><select data-column="responsavel" ${responsavelDisabled}><option value="BI" ${p.responsavel === 'BI' ? 'selected' : ''}>BI</option><option value="Sistema" ${p.responsavel === 'Sistema' ? 'selected' : ''}>Sistema</option><option value="Infraestrutura" ${p.responsavel === 'Infraestrutura' ? 'selected' : ''}>Infraestrutura</option><option value="Suporte" ${p.responsavel === 'Suporte' ? 'selected' : ''}>Suporte</option></select></td>

                <td><input type="text" data-column="chamado" value="${p.chamado||''}" ${fieldsDisabled}/></td>

                <td><input type="text" data-column="solicitante" value="${p.solicitante||''}" ${fieldsDisabled}/></td>

                <td><textarea data-column="situacao" ${fieldsDisabled}>${p.situacao||''}</textarea></td>

                <td><input type="date" data-column="prazo" value="${p.prazo||''}" ${fieldsDisabled}/></td>

                <td><select data-column="prioridade" ${fieldsDisabled}><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>

                <td><select data-column="priority_index" style="width: 70px; text-align: center;" ${indexDisabled}>${indexOptionsHtml}</select></td>

                <td><input type="text" data-column="priorizado" value="${p.priorizado||''}" ${fieldsDisabled}/></td>

                <td>

                    <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">

                        <button onclick="salvarAlteracoesProjeto(${p.id}, this)" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;" ${!canEditRow && !indexDisabled && !responsavelDisabled ? 'disabled' : ''}>Salvar</button> <button onclick="deletarProjeto(${p.id}, '${p.nome}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; width: 80px;" ${!isOwner ? 'disabled' : ''}>Excluir</button> </div>

                </td>`;

        } else {

            tr.innerHTML = `<td>${p.nome||''}</td><td>${p.responsavel||''}</td><td>${p.chamado||''}</td><td>${p.solicitante||''}</td><td>${p.situacao||''}</td><td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td><td>${p.prioridade||''}</td><td>${p.priority_index ?? ''}</td><td>${p.priorizado||''}</td><td></td>`;

        }

        projectListTbody.appendChild(tr);

    });

     console.log("Renderização da tabela concluída.");

}



// ... (Restante das funções: adicionarProjeto, salvarAlteracoesProjeto, deletarProjeto, setupFiltros, PONTO DE PARTIDA)

// NENHUMA ALTERAÇÃO NECESSÁRIA NELAS PARA ESTA FUNCIONALIDADE

async function adicionarProjeto(event) {

    event.preventDefault();

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) return alert('Sessão expirada.');



    const form = event.target;

    // Mantém 'prioridade', usa default DB para 'priority_index'

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



    // Verifica se o botão está realmente habilitado antes de prosseguir

    if (buttonElement.disabled) {

        console.warn("Tentativa de salvar com botão desabilitado.");

        return;

    }





    buttonElement.disabled = true; buttonElement.textContent = 'Salvando...'; tr.style.opacity = '0.7';



    const updateData = {};

    const fields = tr.querySelectorAll('[data-column]:not(:disabled)'); // Pega apenas campos habilitados



    fields.forEach(field => {

        const coluna = field.getAttribute('data-column');

        let valor = field.value;



        // Trata índice (usa 999 se inválido/vazio)

        if (coluna === 'priority_index') {

            valor = parseInt(valor, 10);

            if (isNaN(valor) || valor === null || valor === '') valor = 999; // Usa 999 como fallback

        }

        if (field.type === 'date' && !valor) { valor = null; }

        updateData[coluna] = valor;

    });



     // Se não houver dados para atualizar (talvez só campos desabilitados foram 'alterados'), não faz a chamada

    if (Object.keys(updateData).length === 0) {

        console.log("Nenhum campo editável alterado para salvar.");

        buttonElement.disabled = false; buttonElement.textContent = 'Salvar'; tr.style.opacity = '1';

        // Poderia adicionar um feedback visual rápido aqui

        return;

    }





    console.log("Salvando alterações:", updateData); // Log

    const { error } = await supabaseClient.from('projetos').update(updateData).eq('id', id);



    buttonElement.disabled = false; buttonElement.textContent = 'Salvar'; tr.style.opacity = '1';



    if (error) {

        console.error("Erro ao salvar alterações:", error);

        alert(`Falha ao salvar as alterações do projeto.`);

        tr.style.outline = '2px solid red'; setTimeout(() => { tr.style.outline = ''; }, 2000);

    } else {

        console.log("Alterações salvas com sucesso!"); // Log

        tr.style.outline = '2px solid lightgreen'; setTimeout(() => { tr.style.outline = ''; }, 1500);

        // Recarrega se o índice foi alterado (para reordenar)

        if (updateData.hasOwnProperty('priority_index')) {

            console.log("Índice alterado, recarregando tabela para reordenar."); // Log

            carregarProjetos(true);

        }

    }

}



async function deletarProjeto(id, nome) {

    // Adiciona verificação se o usuário logado é o dono antes do confirm

    if (!usuarioLogado || !id) return;

    const { data: projectOwner, error: ownerError } = await supabaseClient

        .from('projetos')

        .select('user_id')

        .eq('id', id)

        .single();



     if (ownerError || !projectOwner || projectOwner.user_id !== usuarioLogado.id) {

         alert("Você só pode excluir projetos que você mesmo criou.");

         return;

     }





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



// 6. PONTO DE PARTIDA DA APLICAÇÃO

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

        if (_event === 'INITIAL_SESSION') { return; } // Ignora INITIAL_SESSION

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

