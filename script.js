// 1. Configuração do Cliente Supabase
// Vá em "Project Settings" > "API" no seu painel Supabase para encontrar essas informações.
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos da UI
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userSessionDiv = document.getElementById('user-session');

// Formulário de Autenticação
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authToggle = document.getElementById('auth-toggle');
let isLoginMode = true;

// ----- LÓGICA DE AUTENTICAÇÃO -----

// Alterna entre modo Login e Cadastro
authToggle.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Login' : 'Cadastre-se';
    authForm.querySelector('button').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    authToggle.textContent = isLoginMode ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login';
});

// Lida com o envio do formulário de login/cadastro
authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    let error = null;
    if (isLoginMode) {
        // Modo Login
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
        error = signInError;
    } else {
        // Modo Cadastro
        const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        error = signUpError;
        if (!error) {
            alert('Cadastro realizado! Agora faça o login.');
            // Volta para a tela de login
            authToggle.click(); 
        }
    }

    if (error) {
        alert(error.message);
    }
});

// Função para Logout
async function logout() {
    await supabaseClient.auth.signOut();
}

// ----- LÓGICA PRINCIPAL DO APP -----

// Carrega a aplicação para o usuário logado
function loadApp(user) {
    // Esconde a autenticação e mostra o app
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // Mostra a sessão do usuário e o botão de logout
    userSessionDiv.innerHTML = `
        <span>Olá, ${user.email}</span>
        <button onclick="logout()" style="margin-left: 1rem; background: transparent; border: 1px solid black; cursor: pointer;">Sair</button>
    `;

    // Carrega o HTML do formulário e da tabela dentro do <main>
    appContainer.innerHTML = `
        <div id="form-container" style="margin-bottom: 2rem; background-color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0;">Adicionar Novo Projeto</h3>
            <form id="add-project-form"> </form>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Projeto</th>
                    <th>Nº Chamado</th>
                    <th>Responsável</th>
                    <th>Situação Atual</th>
                    <th>Prazo</th>
                    <th>Prioridade</th>
                    <th>Priorizado Por</th>
                </tr>
            </thead>
            <tbody id="project-list"></tbody>
        </table>
    `;
    // Preenche o formulário dinamicamente
    document.getElementById('add-project-form').innerHTML = `
        `;

    // Carrega os projetos
/**
 * Função para CARREGAR os projetos do Supabase e renderizar na tabela.
 */
async function carregarProjetos() {
    // ATUALIZADO: colspan agora é 7
    projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando projetos...</td></tr>';

    const { data: projetos, error } = await supabaseClient
        .from('projetos')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        projectListTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o console.</td></tr>`;
        return;
    }

    projectListTbody.innerHTML = '';

    if (projetos.length === 0) {
        // ATUALIZADO: colspan agora é 7
        projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto encontrado. Adicione um novo acima.</td></tr>';
        return;
    }

    projetos.forEach(projeto => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = projeto.id;
        // ATUALIZADO: Adicionadas as novas colunas (chamado, responsavel, priorizado)
        tr.innerHTML = `
            <td>${projeto.nome}</td>
            <td>
                <input type="text" value="${projeto.chamado || ''}" onblur="atualizarCampo(${projeto.id}, 'chamado', this.value)" style="width:100px;"/>
            </td>
            <td>
                <input type="text" value="${projeto.responsavel || ''}" onblur="atualizarCampo(${projeto.id}, 'responsavel', this.value)" style="width:120px;"/>
            </td>
            <td>
                <textarea onblur="atualizarCampo(${projeto.id}, 'situacao', this.value)">${projeto.situacao || ''}</textarea>
            </td>
            <td>
                <input type="date" value="${projeto.prazo || ''}" onblur="atualizarCampo(${projeto.id}, 'prazo', this.value)" />
            </td>
            <td>
                <select onchange="atualizarCampo(${projeto.id}, 'prioridade', this.value)">
                    <option value="Alta" ${projeto.prioridade === 'Alta' ? 'selected' : ''}>Alta</option>
                    <option value="Média" ${projeto.prioridade === 'Média' ? 'selected' : ''}>Média</option>
                    <option value="Baixa" ${projeto.prioridade === 'Baixa' ? 'selected' : ''}>Baixa</option>
                    <option value="" ${!projeto.prioridade ? 'selected' : ''}>N/A</option>
                </select>
            </td>
            <td>
                <input type="text" value="${projeto.priorizado || ''}" onblur="atualizarCampo(${projeto.id}, 'priorizado', this.value)" style="width:120px;"/>
            </td>
        `;
        projectListTbody.appendChild(tr);
    });
}

/**
 * Função para ATUALIZAR um campo específico de um projeto.
 * (NENHUMA MUDANÇA NECESSÁRIA AQUI)
 */
async function atualizarCampo(id, coluna, valor) {
    console.log(`Atualizando projeto ${id}, coluna ${coluna} para: "${valor}"`);

    const { error } = await supabaseClient
        .from('projetos')
        .update({ [coluna]: valor })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar o projeto:', error);
        alert('Falha ao salvar a alteração. Verifique o console para mais detalhes.');
    } else {
        console.log('Projeto atualizado com sucesso!');
        const tr = document.querySelector(`tr[data-project-id='${id}']`);
        if (tr) {
            tr.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                tr.style.backgroundColor = '';
            }, 1500);
        }
    }
}

/**
 * Função para ADICIONAR um novo projeto no Supabase.
 */
async function adicionarProjeto(event) {
    event.preventDefault();

    // ATUALIZADO: Pega os valores dos novos campos
    const nome = document.getElementById('form-nome').value;
    const chamado = document.getElementById('form-chamado').value;
    const situacao = document.getElementById('form-situacao').value;
    const prazo = document.getElementById('form-prazo').value;
    const responsavel = document.getElementById('form-responsavel').value;
    const prioridade = document.getElementById('form-prioridade').value;
    const priorizado = document.getElementById('form-priorizado').value;

    if (!nome) {
        alert('O nome do projeto é obrigatório.');
        return;
    }

    // ATUALIZADO: Inclui os novos campos no objeto a ser inserido
    const { error } = await supabaseClient
        .from('projetos')
        .insert([{ 
            nome: nome, 
            chamado: chamado || null,
            responsavel: responsavel || null,
            situacao: situacao, 
            prazo: prazo || null,
            prioridade: prioridade,
            priorizado: priorizado || null
        }]);

    if (error) {
        console.error('Erro ao adicionar projeto:', error);
        alert('Falha ao adicionar o projeto. Verifique o console e as permissões (RLS) no Supabase.');
    } else {
        console.log('Projeto adicionado com sucesso!');
        document.getElementById('add-project-form').reset(); // Limpa o formulário
        carregarProjetos(); // Recarrega a lista de projetos
    }
}

// PONTO DE PARTIDA: Executa quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();
    
    // Configura o formulário de adição
    const addForm = document.getElementById('add-project-form');
    //addForm.addEventListener('submit', adicionarProjeto);
});

// Limpa a UI quando o usuário desloga
function clearApp() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    userSessionDiv.innerHTML = '';
    appContainer.innerHTML = '';
}

// ----- FUNÇÕES DO GERENCIADOR (QUASE SEM MUDANÇAS) -----

async function carregarProjetos() {
    // ATUALIZADO: colspan agora é 7
    projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando projetos...</td></tr>';

    const { data: projetos, error } = await supabaseClient
        .from('projetos')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        projectListTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o console.</td></tr>`;
        return;
    }

    projectListTbody.innerHTML = '';

    if (projetos.length === 0) {
        // ATUALIZADO: colspan agora é 7
        projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto encontrado. Adicione um novo acima.</td></tr>';
        return;
    }

    projetos.forEach(projeto => {
        const tr = document.createElement('tr');
        tr.dataset.projectId = projeto.id;
        // ATUALIZADO: Adicionadas as novas colunas (chamado, responsavel, priorizado)
        tr.innerHTML = `
            <td>${projeto.nome}</td>
            <td>
                <input type="text" value="${projeto.chamado || ''}" onblur="atualizarCampo(${projeto.id}, 'chamado', this.value)" style="width:100px;"/>
            </td>
            <td>
                <input type="text" value="${projeto.responsavel || ''}" onblur="atualizarCampo(${projeto.id}, 'responsavel', this.value)" style="width:120px;"/>
            </td>
            <td>
                <textarea onblur="atualizarCampo(${projeto.id}, 'situacao', this.value)">${projeto.situacao || ''}</textarea>
            </td>
            <td>
                <input type="date" value="${projeto.prazo || ''}" onblur="atualizarCampo(${projeto.id}, 'prazo', this.value)" />
            </td>
            <td>
                <select onchange="atualizarCampo(${projeto.id}, 'prioridade', this.value)">
                    <option value="Alta" ${projeto.prioridade === 'Alta' ? 'selected' : ''}>Alta</option>
                    <option value="Média" ${projeto.prioridade === 'Média' ? 'selected' : ''}>Média</option>
                    <option value="Baixa" ${projeto.prioridade === 'Baixa' ? 'selected' : ''}>Baixa</option>
                    <option value="" ${!projeto.prioridade ? 'selected' : ''}>N/A</option>
                </select>
            </td>
            <td>
                <input type="text" value="${projeto.priorizado || ''}" onblur="atualizarCampo(${projeto.id}, 'priorizado', this.value)" style="width:120px;"/>
            </td>
        `;
        projectListTbody.appendChild(tr);
    });
}

async function atualizarCampo(id, coluna, valor) {
    console.log(`Atualizando projeto ${id}, coluna ${coluna} para: "${valor}"`);

    const { error } = await supabaseClient
        .from('projetos')
        .update({ [coluna]: valor })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar o projeto:', error);
        alert('Falha ao salvar a alteração. Verifique o console para mais detalhes.');
    } else {
        console.log('Projeto atualizado com sucesso!');
        const tr = document.querySelector(`tr[data-project-id='${id}']`);
        if (tr) {
            tr.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                tr.style.backgroundColor = '';
            }, 1500);
        }
    }
}

async function adicionarProjeto(event) {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser(); // Pega o usuário atual
    
    // Pega os valores dos forms...
    const nome = document.getElementById('form-nome').value;
    const chamado = document.getElementById('form-chamado').value;
    const situacao = document.getElementById('form-situacao').value;
    const prazo = document.getElementById('form-prazo').value;
    const responsavel = document.getElementById('form-responsavel').value;
    const prioridade = document.getElementById('form-prioridade').value;
    const priorizado = document.getElementById('form-priorizado').value;

    if (!nome) {
        alert('O nome do projeto é obrigatório.');
        return;
    }

    const { error } = await supabaseClient
        .from('projetos')
        .insert([{ 
            nome: nome, 
            chamado: chamado || null,
            responsavel: responsavel || null,
            situacao: situacao, 
            prazo: prazo || null,
            prioridade: prioridade,
            priorizado: priorizado || null,
            user_id: user.id 
        }]);
    
    if (error) {
        console.error('Erro ao adicionar projeto:', error);
        alert('Falha ao adicionar o projeto. Verifique o console e as permissões (RLS) no Supabase.');
    } else {
        console.log('Projeto adicionado com sucesso!');
        document.getElementById('add-project-form').reset(); // Limpa o formulário
        carregarProjetos(); // Recarrega a lista de projetos
    }
}


// ----- PONTO DE PARTIDA -----

// Verifica o estado da autenticação quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        loadApp(session.user);
    } else {
        clearApp();
    }
});

// Escuta por mudanças no estado de autenticação (login, logout)
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        loadApp(session.user);
    }
    if (event === 'SIGNED_OUT') {
        clearApp();
    }});
