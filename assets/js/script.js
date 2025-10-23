
// Simulação de Banco de Dados/Armazenamento de Dados no cliente
// Usuários (RF001) - Simulações de Administrador e Usuário Comum
let users = [
    { username: 'admin', password: '123', registration: 'A001', role: 'admin' },
    { username: 'user', password: '456', registration: 'U001', role: 'user' },
    { username: 'Rafa', password: '2405', registration: 'U002', role: 'user' }
];

// Equipamentos (RF002)
let equipments = [];

// Variável de controle de sessão (RF006)
let loggedInUser = null;
// Helper: key prefix para avatar no localStorage
const AVATAR_KEY_PREFIX = 'avatar_for_';
// Avatar default (SVG small) como data URL para evitar arquivo extra
const DEFAULT_AVATAR_DATAURL = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1"><rect width="24" height="24" rx="4" fill="#40B7FF"/><circle cx="12" cy="9" r="3.2" fill="white"/><path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" fill="white" opacity="0.9"/></svg>`
);

/**
 * Funções de Navegação e Controle de Tela
 * O usuário deve estar logado para realizar qualquer operação (RF006)
 */
function navigate(screenId) {
    // Verifica se o usuário está logado, exceto para a tela de login
    if (screenId !== 'login-screen' && !loggedInUser) {
        alert('Você precisa estar logado para acessar esta funcionalidade.');
        navigate('login-screen');
        return;
    }

    // Exibe a tela de login se não estiver logado
    if (screenId !== 'login-screen' && screenId !== 'menu-screen' && !loggedInUser) {
        navigate('login-screen');
        return;
    }

    // O sistema deve conter um Menu (RF007)
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // Funções específicas ao entrar na tela
    if (screenId === 'manage-equipment-screen') {
        renderEquipmentList();
    } else if (screenId === 'report-screen') {
        document.getElementById('report-output').innerHTML = ''; // Limpa relatórios anteriores
    } else if (screenId === 'manage-users-screen') {
        renderUserList();
    }
}

/**
 * Funcionalidade de Login (RF004)
 */
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorDisplay = document.getElementById('login-error');
    errorDisplay.textContent = ''; // Limpa mensagens de erro

    // Valida se os campos obrigatórios foram preenchidos (Fluxo Alternativo 3b - Login)
    if (!usernameInput || !passwordInput) {
        errorDisplay.textContent = 'Usuário e senha são obrigatórios.';
        return;
    }

    const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
        loggedInUser = user;
        // O sistema valida o acesso e direciona para o "Menu" (Fluxo Principal 4 - Login)
        navigate('menu-screen');
        // Exibir/Esconder funcionalidades de Administrador (RF001)
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = user.role === 'admin' ? 'block' : 'none';
        });
    // Exibir avatar do usuário, se houver
    loadAndShowAvatar(user.username);
    } else {
        // Usuário ou senha incorretos (Fluxo Alternativo 3a - Login)
        errorDisplay.textContent = 'Credenciais inválidas. Tente novamente.';
    }
});

function logout() {
    loggedInUser = null;
    // Esconder avatar localmente
    hideAvatar();
    navigate('login-screen');
    alert('Sessão encerrada.');
}

/**
 * Funcionalidade de Manter Usuários (RF001) - Apenas Admin
 */
function renderUserList() {
    const listContainer = document.getElementById('user-list');
    listContainer.innerHTML = '<h3>Lista de Usuários</h3>';

    users.forEach(user => {
        listContainer.innerHTML += `
            <div class="equipment-item">
                <span>${user.username} (${user.role}) - Reg: ${user.registration}</span>
            </div>
        `;
    });
}

function showUserForm() {
    document.getElementById('user-form-container').style.display = 'block';
    document.getElementById('user-error').textContent = '';
    // Limpar campos
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-password').value = '';
    document.getElementById('new-user-registration').value = '';
}

function hideUserForm() {
    document.getElementById('user-form-container').style.display = 'none';
}

document.getElementById('user-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('new-user-name').value;
    const password = document.getElementById('new-user-password').value;
    const registration = document.getElementById('new-user-registration').value;
    const errorDisplay = document.getElementById('user-error');
    errorDisplay.textContent = '';

    // Validação de campos obrigatórios (RNF005 / Fluxo Alternativo 5b - Manter Usuário)
    if (!username || !password || !registration) {
        errorDisplay.textContent = 'Todos os campos são obrigatórios.';
        return;
    }

    // Validação de usuário existente (Fluxo Alternativo 5a - Manter Usuário)
    if (users.find(u => u.username === username)) {
        errorDisplay.textContent = `O usuário "${username}" já existe.`;
        return;
    }

    // Criação do novo usuário
    users.push({ username, password, registration, role: 'user' });
    alert(`Usuário "${username}" criado com sucesso!`);
    hideUserForm();
    renderUserList(); // Atualiza a lista
});


/**
 * Funcionalidade de Manter Equipamentos (RF002)
 */
function renderEquipmentList() {
    const listContainer = document.getElementById('equipment-list');
    listContainer.innerHTML = '<h3>Lista de Equipamentos</h3>';

    if (equipments.length === 0) {
        listContainer.innerHTML += '<p>Nenhum equipamento cadastrado.</p>';
        return;
    }

    equipments.forEach(eq => {
        listContainer.innerHTML += `
            <div class="equipment-item">
                <div>
                    <h4>${eq.name} (${eq.tags})</h4>
                    <small>Status: ${eq.status} | Modelo: ${eq.model}</small>
                </div>
                <div>
                    <button onclick="editEquipment(${eq.id})" class="btn-neutral">Editar</button>
                    <button onclick="deleteEquipment(${eq.id})" class="btn-delete">Excluir</button>
                </div>
            </div>
        `;
    });
}

function showEquipmentForm(equipment = null) {
    document.getElementById('equipment-form-container').style.display = 'block';
    document.getElementById('equipment-error').textContent = '';
    const form = document.getElementById('equipment-form');

    if (equipment) {
        // Modo Edição
        document.getElementById('eq-id').value = equipment.id;
        document.getElementById('eq-model').value = equipment.model;
        document.getElementById('eq-manufacturer').value = equipment.manufacturer;
        document.getElementById('eq-type').value = equipment.type;
        document.getElementById('eq-name').value = equipment.name;
        document.getElementById('eq-tags').value = equipment.tags;
        document.getElementById('eq-status').value = equipment.status;
    } else {
        // Modo Cadastro
        form.reset();
        document.getElementById('eq-id').value = '';
    }
}

function hideEquipmentForm() {
    document.getElementById('equipment-form-container').style.display = 'none';
}

document.getElementById('equipment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('eq-id').value;
    const model = document.getElementById('eq-model').value;
    const manufacturer = document.getElementById('eq-manufacturer').value;
    const type = document.getElementById('eq-type').value;
    const name = document.getElementById('eq-name').value;
    const tags = document.getElementById('eq-tags').value;
    const status = document.getElementById('eq-status').value;
    const errorDisplay = document.getElementById('equipment-error');
    errorDisplay.textContent = '';

    // Validação de campos obrigatórios (RNF005 / Fluxo Alternativo 5a/9a - Manter Equipamentos)
    if (!model || !manufacturer || !type || !name || !tags || !status) {
        errorDisplay.textContent = 'Todos os campos são obrigatórios.';
        return;
    }

    if (id) {
        // Edição (Fluxo Principal 10 - Manter Equipamentos)
        const index = equipments.findIndex(eq => eq.id == id);
        if (index !== -1) {
            equipments[index] = { id: parseInt(id), model, manufacturer, type, name, tags, status };
            alert('Equipamento atualizado com sucesso!');
        }
    } else {
        // Cadastro (Fluxo Principal 6 - Manter Equipamentos)
        const newId = equipments.length > 0 ? Math.max(...equipments.map(eq => eq.id)) + 1 : 1;
        equipments.push({ id: newId, model, manufacturer, type, name, tags, status });
        alert('Equipamento adicionado com sucesso!');
    }

    hideEquipmentForm();
    renderEquipmentList();
});

function editEquipment(id) {
    const equipment = equipments.find(eq => eq.id === id);
    if (equipment) {
        showEquipmentForm(equipment);
    }
}

function deleteEquipment(id) {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
        // Exclusão (Fluxo Principal 14 - Manter Equipamentos)
        equipments = equipments.filter(eq => eq.id !== id);
        alert('Equipamento excluído com sucesso!');
        renderEquipmentList();
    }
}

/**
 * Funcionalidade de Gerar Relatório (RF003)
 */
function generateReport() {
    const reportOutput = document.getElementById('report-output');
    reportOutput.innerHTML = ''; // Limpa o output

    // Verifica se há equipamentos cadastrados (Fluxo Alternativo 3a - Gerar Relatório)
    if (equipments.length === 0) {
        reportOutput.innerHTML = '<p class="error-message">Não há equipamentos cadastrados para gerar o relatório.</p>';
        return;
    }

    // Gera dados como: Quantidade de equipamentos em cada status e total (Fluxo Principal 4 - Gerar Relatório)
    const totalEquipments = equipments.length;
    const statusCounts = equipments.reduce((acc, eq) => {
        acc[eq.status] = (acc[eq.status] || 0) + 1;
        return acc;
    }, {});

    let reportHTML = '<h3>Relatório de Equipamentos</h3>';
    reportHTML += `<p>Total de Equipamentos Registrados: <strong>${totalEquipments}</strong></p>`;
    reportHTML += '<h4>Status dos Equipamentos:</h4>';
    reportHTML += '<ul>';
    for (const status in statusCounts) {
        // Status em destaque (RF003)
        reportHTML += `<li><strong>${status}:</strong> ${statusCounts[status]}</li>`;
    }
    reportHTML += '</ul>';

    reportOutput.innerHTML = reportHTML;
}

/**
 * Funcionalidade de Verificar Status (RF005)
 */
document.getElementById('check-status-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const tag = document.getElementById('status-tag').value.trim();
    const statusOutput = document.getElementById('status-output');
    const errorDisplay = document.getElementById('status-error');
    statusOutput.innerHTML = '';
    errorDisplay.textContent = '';

    // Validação de tag obrigatória (Fluxo Alternativo 3b - Verificar Status)
    if (!tag) {
        errorDisplay.textContent = 'A tag do equipamento é obrigatória.';
        return;
    }

    // O usuário deve ser capaz de verificar o status utilizando apenas a tag (RF005)
    const equipment = equipments.find(eq => eq.tags.split(',').map(t => t.trim()).includes(tag));

    if (equipment) {
        // Exibe as informações (Fluxo Principal 5 - Verificar Status)
        statusOutput.innerHTML = `
            <h3>Status do Equipamento (Tag: ${tag})</h3>
            <p><strong>Nome:</strong> ${equipment.name}</p>
            <p><strong>Modelo:</strong> ${equipment.model}</p>
            <p><strong>Fabricante:</strong> ${equipment.manufacturer}</p>
            <p><strong>Tipo:</strong> ${equipment.type}</p>
            <p><strong>Status:</strong> <strong style="color: ${equipment.status === 'Em Operação' ? 'var(--color-confirm)' : equipment.status === 'Em Manutenção' ? 'orange' : 'var(--color-cancel-delete)'};">${equipment.status}</strong></p>
        `;
    } else {
        // Tag não encontrada (Fluxo Alternativo 3a - Verificar Status)
        errorDisplay.textContent = `Tag "${tag}" não encontrada.`;
    }
});

// Inicialização: Começa na tela de login
navigate('login-screen');

// Adiciona equipamentos de exemplo para testes
equipments.push({ id: 1, model: 'ProBook 450 G8', manufacturer: 'HP', type: 'Notebook', name: 'Notebook João', tags: 'NB001,HP450', status: 'Em Operação' });
equipments.push({ id: 2, model: 'LaserJet Pro', manufacturer: 'HP', type: 'Impressora', name: 'Impressora Escritório', tags: 'IMP001', status: 'Em Manutenção' });
equipments.push({ id: 3, model: 'Monitor Z27', manufacturer: 'Dell', type: 'Monitor', name: 'Monitor Sala 1', tags: 'MON001', status: 'Desativado' });

// Avatar: setup elementos e listeners
const avatarImg = document.getElementById('profile-avatar');
const avatarInput = document.getElementById('avatar-input');

// Carrega avatar do localStorage para o username atual
function loadAndShowAvatar(username) {
    if (!username) return;
    const key = AVATAR_KEY_PREFIX + username;
    const dataUrl = localStorage.getItem(key);
    if (avatarImg) {
        if (dataUrl) {
            avatarImg.src = dataUrl;
        } else {
            // usa avatar default quando não houver imagem salva
            avatarImg.src = DEFAULT_AVATAR_DATAURL;
        }
        avatarImg.style.display = 'inline-block';
    }
}

function hideAvatar() {
    if (avatarImg) {
        avatarImg.style.display = 'none';
        avatarImg.src = '';
    }
}

// Ao clicar na imagem, abre seletor; se não tiver imagem, clic no header também abre
avatarImg && avatarImg.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarInput && avatarInput.click();
});

const headerRight = document.querySelector('.header-right');
headerRight && headerRight.addEventListener('click', () => {
    avatarInput && avatarInput.click();
});

// Quando selecionar arquivo, ler como dataURL e salvar no localStorage sob a chave do usuário
avatarInput && avatarInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Limitar tamanho razoável (ex: 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Arquivo muito grande. Escolha uma imagem menor que 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        if (loggedInUser && loggedInUser.username) {
            const key = AVATAR_KEY_PREFIX + loggedInUser.username;
            try {
                localStorage.setItem(key, dataUrl);
                loadAndShowAvatar(loggedInUser.username);
                alert('Foto de perfil atualizada.');
            } catch (err) {
                console.error('Erro ao salvar avatar:', err);
                alert('Não foi possível salvar a imagem.');
            }
        } else {
            alert('Faça login para salvar sua foto de perfil.');
        }
    };
    reader.readAsDataURL(file);
});
