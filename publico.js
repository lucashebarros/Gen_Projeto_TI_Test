// 1. Configuração do Cliente Supabase (igual ao outro arquivo)
const SUPABASE_URL = 'https://rprwkinapuwsdpiifrdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcndraW5hcHV3c2RwaWlmcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDQ4NjAsImV4cCI6MjA3Mzc4MDg2MH0.enGl5j313BI8cMxe6soGhViHd6667z8usxtJXPR2F9k';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Elemento da Tabela
const projectListTbody = document.getElementById('public-project-list');

/**
 * Função para carregar TODOS os projetos e renderizar em modo LEITURA.
 */
async function carregarProjetosPublicos() {
    projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando projetos...</td></tr>';

    const { data: projetos, error } = await supabaseClient
        .from('projetos')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar projetos:', error);
        projectListTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar projetos.</td></tr>`;
        return;
    }

    if (projetos.length === 0) {
        projectListTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto encontrado.</td></tr>';
        return;
    }

    // Limpa a tabela antes de adicionar os dados
    projectListTbody.innerHTML = '';

    projetos.forEach(projeto => {
        const tr = document.createElement('tr');
        // Note que aqui não há inputs ou textareas, apenas o texto.
        tr.innerHTML = `
            <td>${projeto.nome || ''}</td>
            <td>${projeto.chamado || ''}</td>
            <td>${projeto.responsavel || ''}</td>
            <td>${projeto.situacao || ''}</td>
            <td>${projeto.prazo ? new Date(projeto.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''}</td>
            <td>${projeto.prioridade || ''}</td>
            <td>${projeto.priorizado || ''}</td>
        `;
        projectListTbody.appendChild(tr);
    });
}

// Carrega os projetos assim que a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarProjetosPublicos);
