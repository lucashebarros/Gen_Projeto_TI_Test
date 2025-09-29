// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Seleção dos Elementos HTML Principais
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userSessionDiv = document.getElementById('user-session');
const authForm = document.getElementById('auth-form');

// 3. Lógica de Autenticação (Funções e Eventos de Login/Cadastro)
let isLoginMode = true;

document.getElementById('auth-toggle').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').textContent = isLoginMode ? 'Login' : 'Cadastre-se';
    authForm.querySelector('button').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    document.getElementById('auth-toggle').textContent = isLoginMode ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login';
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o refresh da página
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const button = authForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Aguarde...';

    let error = null;
    if (isLoginMode) {
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
        error = signInError;
    } else {
        const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        error = signUpError;
        if (!error) {
            alert('Cadastro realizado com sucesso! Por favor, faça o login.');
            document.getElementById('auth-toggle').click();
        }
    }

    if (error) alert(error.message);
    
    button.disabled = false;
    button.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
});

async function logout() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// 4. Funções do Gerenciador de Projetos (Definidas uma única vez)

async function carregarProjetos() {
    const projectListTbody = document.getElementById('project-list');
    if (!projectListTbody) return;

    projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando projetos...</td></tr>';
    const { data: projetos, error } = await supabaseClient.from('projetos').select('*').order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        projectListTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`;
        return;
    }

    projectListTbody.innerHTML = '';
    if (projetos.length === 0) {
        projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto encontrado. Adicione um novo.</td></tr>';
        return;
    }

    projetos.forEach(projeto => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = projeto.id;
        tr.innerHTML = `
            <td>${projeto.nome}</td>
            <td><input type="text" value="${projeto.chamado || ''}" onblur="atualizarCampo(${projeto.id}, 'chamado', this.value)" style="width:100px;"/></td>
            <td><input type="text" value="${projeto.responsavel || ''}" onblur="atualizarCampo(${projeto.id}, 'responsavel', this.value)" style="width:120px;"/></td>
            <td><textarea onblur="atualizarCampo(${projeto.id}, 'situacao', this.value)">${projeto.situacao || ''}</textarea></td>
            <td><input type="date" value="${projeto.prazo || ''}" onblur="atualizarCampo(${projeto.id}, 'prazo', this.value)" /></td>
            <td><select onchange="atualizarCampo(${projeto.id}, 'prioridade', this.value)"><option value="Alta" ${projeto.prioridade === 'Alta' ? 'selected' : ''}>Alta</option><option value="Média" ${projeto.prioridade === 'Média' ? 'selected' : ''}>Média</option><option value="Baixa" ${projeto.prioridade === 'Baixa' ? 'selected' : ''}>Baixa</option><option value="" ${!projeto.prioridade ? 'selected' : ''}>N/A</option></select></td>
            <td><input type="text" value="${projeto.priorizado || ''}" onblur="atualizarCampo(${projeto.id}, 'priorizado', this.value)" style="width:120px;"/></td>
        `;
        projectListTbody.appendChild(tr);
    });
}

async function atualizarCampo(id, coluna, valor) {
    const { error } = await supabaseClient.from('projetos').update({ [coluna]: valor }).eq('id', id);
    if (error) console.error('Erro ao atualizar o projeto:', error);
    else {
        const tr = document.querySelector(`tr[data-project-id='${id}']`);
        if (tr) {
            tr.style.backgroundColor = '#d4edda';
            setTimeout(() => { tr.style.backgroundColor = ''; }, 1500);
        }
    }
}

async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Sessão expirada. Faça login novamente.');

    const form = event.target;
    const nome = form.querySelector('#form-nome').value;
    const chamado = form.querySelector('#form-chamado').value;
    const situacao = form.querySelector('#form-situacao').value;
    const prazo = form.querySelector('#form-prazo').value;
    const responsavel = form.querySelector('#form-responsavel').value;
    const prioridade = form.querySelector('#form-prioridade').value;
    const priorizado = form.querySelector('#form-priorizado').value;

    if (!nome) { alert('O nome do projeto é obrigatório.'); return; }

    const { error } = await supabaseClient.from('projetos').insert([{
        nome, chamado, responsavel, situacao, prazo: prazo || null, prioridade, priorizado, user_id: user.id
    }]);

    if (error) console.error('Erro ao adicionar projeto:', error);
    else {
        form.reset();
        carregarProjetos();
    }
}

// 5. Lógica de Controle de Estado (O que mostrar na tela?)

function loadApp(user) {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userSessionDiv.innerHTML = `<span>Olá, ${user.email}</span><button id="logout-button" style="margin-left: 1rem; cursor: pointer;">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', logout);

    appContainer.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form" style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 2 1 60%;"><label for="form-nome">Nome do Projeto:</label><input type="text" id="form-nome" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-chamado">Nº do Chamado:</label><input type="text" id="form-chamado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><label for="form-situacao">Situação Atual:</label><textarea id="form-situacao" style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea></div>
                <div style="flex: 1 1 30%;"><label for="form-prazo">Prazo:</label><input type="date" id="form-prazo" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-responsavel">Responsável (Abertura):</label><input type="text" id="form-responsavel" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 30%;"><label for="form-prioridade">Prioridade:</label><select id="form-prioridade" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"><option value="Alta">Alta</option><option value="Média" selected>Média</option><option value="Baixa">Baixa</option></select></div>
                <div style="flex: 1 1 100%;"><label for="form-priorizado">Priorizado Por:</label><input type="text" id="form-priorizado" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></div>
                <div style="flex: 1 1 100%;"><button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Salvar Novo Projeto</button></div>
            </form>
        </div>
        <table>
            <thead><tr><th>Projeto</th><th>Nº Chamado</th><th>Responsável</th><th>Situação Atual</th><th>Prazo</th><th>Prioridade</th><th>Priorizado Por</th></tr></thead>
            <tbody id="project-list"></tbody>
        </table>`;
    
    carregarProjetos();
    document.getElementById('add-project-form').addEventListener('submit', adicionarProjeto);
}

function clearApp() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    userSessionDiv.innerHTML = '';
    appContainer.innerHTML = '';
}

// 6. Ponto de Partida da Aplicação
supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) {
        loadApp(session.user);
    } else {
        clearApp();
    }
});

// Torna a função acessível para o HTML (onblur, onchange)
window.atualizarCampo = atualizarCampo;
