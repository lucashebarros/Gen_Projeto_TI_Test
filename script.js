// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Seleção dos Elementos HTML
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const headerAuthSection = document.getElementById('header-auth-section');
const formWrapper = document.getElementById('form-wrapper');

// 3. Lógica de Autenticação
document.getElementById('login-button')?.addEventListener('click', () => authContainer.classList.remove('hidden'));
document.getElementById('close-login-button')?.addEventListener('click', () => authContainer.classList.add('hidden'));

let isLoginMode = true;
document.getElementById('auth-toggle').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').textContent = isLoginMode ? 'Login' : 'Cadastre-se';
    authForm.querySelector('button').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    document.getElementById('auth-toggle').textContent = isLoginMode ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login';
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const button = authForm.querySelector('button');
    button.disabled = true; button.textContent = 'Aguarde...';

    let error = null;
    if (isLoginMode) {
        ({ error } = await supabaseClient.auth.signInWithPassword({ email, password }));
    } else {
        ({ error } = await supabaseClient.auth.signUp({ email, password }));
        if (!error) {
            alert('Cadastro realizado! Por favor, faça o login.');
            document.getElementById('auth-toggle').click();
        }
    }

    if (error) alert(error.message);
    button.disabled = false; button.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
});

async function logout() {
    await supabaseClient.auth.signOut();
}

// 4. Lógica de Controle de Estado (Admin vs. Público)

function entrarModoAdmin(user) {
    authContainer.classList.add('hidden'); // Esconde o modal de login
    headerAuthSection.innerHTML = `<span>Olá, ${user.email}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', logout);
    
    // Mostra o formulário de adição de projetos
    formWrapper.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form"> </form>
        </div>`;
    
    const formHtml = `
        <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
            <div style="flex: 2 1 60%;"><label for="form-nome">Nome:</label><input type="text" id="form-nome" required style="width: 100%; padding: 8px;"></div>
            <div style="flex: 1 1 30%;"><label for="form-chamado">Chamado:</label><input type="text" id="form-chamado" style="width: 100%; padding: 8px;"></div>
            <div style="flex: 1 1 100%;"><label for="form-situacao">Situação:</label><textarea id="form-situacao" style="width: 100%; min-height: 60px; padding: 8px;"></textarea></div>
            <div style="flex: 1 1 30%;"><label for="form-prazo">Prazo:</label><input type="date" id="form-prazo" style="width: 100%; padding: 8px;"></div>
            <div style="flex: 1 1 30%;"><label for="form-responsavel">Responsável:</label><input type="text" id="form-responsavel" style="width: 100%; padding: 8px;"></div>
            <div style="flex: 1 1 30%;"><label for="form-prioridade">Prioridade:</label><select id="form-prioridade" style="width: 100%; padding: 8px;"><option>Alta</option><option selected>Média</option><option>Baixa</option></select></div>
            <div style="flex: 1 1 100%;"><label for="form-priorizado">Priorizado Por:</label><input type="text" id="form-priorizado" style="width: 100%; padding: 8px;"></div>
            <div style="flex: 1 1 100%;"><button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; cursor: pointer;">Salvar</button></div>
        </div>`;
    document.getElementById('add-project-form').innerHTML = formHtml;
    document.getElementById('add-project-form').addEventListener('submit', adicionarProjeto);

    carregarProjetos(true); // Recarrega a tabela em MODO ADMIN
}

function entrarModoPublico() {
    headerAuthSection.innerHTML = `<button id="login-button">Admin / Login</button>`;
    document.getElementById('login-button').addEventListener('click', () => authContainer.classList.remove('hidden'));
    formWrapper.innerHTML = ''; // Limpa o formulário de adição
    carregarProjetos(false); // Carrega a tabela em MODO PÚBLICO
}

// 5. Funções do Gerenciador de Projetos

async function carregarProjetos(isAdmin) {
    const projectListTbody = document.getElementById('project-list');
    projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando projetos...</td></tr>';
    const { data: projetos, error } = await supabaseClient.from('projetos').select('*').order('created_at', { ascending: false });

    if (error) { projectListTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar.</td></tr>`; return; }
    if (projetos.length === 0) { projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto encontrado.</td></tr>'; return; }

    projectListTbody.innerHTML = '';
    projetos.forEach(p => {
        const tr = document.createElement('tr');
        if (isAdmin) {
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td><input type="text" value="${p.chamado||''}" onblur="atualizarCampo(${p.id}, 'chamado', this.value)"/></td>
                <td><input type="text" value="${p.responsavel||''}" onblur="atualizarCampo(${p.id}, 'responsavel', this.value)"/></td>
                <td><textarea onblur="atualizarCampo(${p.id}, 'situacao', this.value)">${p.situacao||''}</textarea></td>
                <td><input type="date" value="${p.prazo||''}" onblur="atualizarCampo(${p.id}, 'prazo', this.value)" /></td>
                <td><select onchange="atualizarCampo(${p.id}, 'prioridade', this.value)"><option ${p.prioridade==='Alta'?'selected':''}>Alta</option><option ${p.prioridade==='Média'?'selected':''}>Média</option><option ${p.prioridade==='Baixa'?'selected':''}>Baixa</option></select></td>
                <td><input type="text" value="${p.priorizado||''}" onblur="atualizarCampo(${p.id}, 'priorizado', this.value)"/></td>`;
        } else {
            tr.innerHTML = `
                <td>${p.nome||''}</td>
                <td>${p.chamado||''}</td>
                <td>${p.responsavel||''}</td>
                <td>${p.situacao||''}</td>
                <td>${p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td>
                <td>${p.prioridade||''}</td>
                <td>${p.priorizado||''}</td>`;
        }
        projectListTbody.appendChild(tr);
    });
}

// As funções `adicionarProjeto` e `atualizarCampo` permanecem praticamente as mesmas de antes

async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada.');

    const form = event.target;
    const nome = form.querySelector('#form-nome').value;
    const chamado = form.querySelector('#form-chamado').value;
    const situacao = form.querySelector('#form-situacao').value;
    const prazo = form.querySelector('#form-prazo').value;
    const responsavel = form.querySelector('#form-responsavel').value;
    const prioridade = form.querySelector('#form-prioridade').value;
    const priorizado = form.querySelector('#form-priorizado').value;

    if (!nome) { alert('O nome é obrigatório.'); return; }

    const { error } = await supabaseClient.from('projetos').insert([{
        nome, chamado, responsavel, situacao, prazo: prazo || null, prioridade, priorizado, user_id: user.id
    }]);

    if (error) { console.error(error); alert('Falha ao adicionar projeto.'); }
    else { form.reset(); carregarProjetos(true); } // Recarrega no modo admin
}

async function atualizarCampo(id, coluna, valor) {
    const { error } = await supabaseClient.from('projetos').update({ [coluna]: valor }).eq('id', id);
    if (error) console.error(error);
    else {
        const tr = document.querySelector(`tr[data-project-id='${id}']`);
        if (tr) { tr.style.backgroundColor = '#d4edda'; setTimeout(() => { tr.style.backgroundColor = ''; }, 1500); }
    }
}
window.atualizarCampo = atualizarCampo; // Torna a função acessível para o HTML

// 6. Ponto de Partida da Aplicação
supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) {
        entrarModoAdmin(session.user);
    } else {
        entrarModoPublico();
    }
});
