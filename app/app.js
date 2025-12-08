// ================= VARIÁVEIS GLOBAIS (O "Quadro Branco") =================
let treinoAtualId = null; // Aqui guardamos o ID do treino para usar na hora de salvar

// ================= CONFIGURAÇÃO INICIAL =================
async function verificarLogin() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (!user) {
        window.location.href = "login.html";
    } else {
        console.log("Usuário logado:", user.id);
        carregarPerfil(user.id);
        carregarTreino(user.id);
    }
}

verificarLogin();

// ================= FUNÇÃO 1: CARREGAR PERFIL =================
async function carregarPerfil(userId) {
    const { data, error } = await _supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', userId)
        .single();

    if (data) {
        document.querySelector('.greeting').innerText = `Bom dia, ${data.nome_completo.split(' ')[0]} 🚀`;
    }
}

// ================= FUNÇÃO 2: CARREGAR TREINO =================
async function carregarTreino(userId) {
    const { data: rel } = await _supabase
        .from('relacionamentos')
        .select('id')
        .eq('aluno_id', userId)
        .single();

    if (rel) {
        const { data: treino } = await _supabase
            .from('treinos')
            .select('*')
            .eq('relacionamento_id', rel.id)
            .single();

        if (treino) {
            renderizarTreino(treino);
        }
    }
}

// ================= FUNÇÃO 3: DESENHAR NA TELA =================
function renderizarTreino(treino) {
    // IMPORTANTE: Guardamos o ID do treino na variável global
    treinoAtualId = treino.id;

    document.querySelector('.card-text h2').innerText = treino.titulo;
    document.querySelector('.card-text p').innerText = treino.descricao;

    const lista = document.querySelector('.exercise-list');
    lista.innerHTML = '<h3>Sua sequência</h3>';

    let exerciciosReais = [];
    
    // Tratamento robusto do JSON
    if (Array.isArray(treino.exercicios)) {
        exerciciosReais = treino.exercicios;
    } else if (typeof treino.exercicios === 'string') {
        try {
            exerciciosReais = JSON.parse(treino.exercicios);
        } catch (e) {
            console.error("Erro JSON:", e);
        }
    }

    if (!exerciciosReais || exerciciosReais.length === 0) {
        lista.innerHTML += '<p style="color: #666; padding: 1rem;">Sem exercícios.</p>';
        return;
    }

    exerciciosReais.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        const videoLink = ex.video || "https://www.youtube.com/embed/IODxDxX7oi4?si=br8Y7b4y7s9p4Xp7";
        
        card.innerHTML = `
            <div class="check-circle"><i class="ri-check-line"></i></div>
            <div class="exercise-info">
                <h4>${ex.nome || "Exercício"}</h4>
                <p>${ex.series} séries • ${ex.reps} repetições</p>
            </div>
            <div class="video-btn" data-link="${videoLink}"><i class="ri-play-circle-line"></i></div>
        `;
        lista.appendChild(card);
    });

    ativarCliquesCards();
    ativarCliquesVideo();
}

// ================= FUNÇÃO 4: LÓGICA DE CHECK E SALVAMENTO =================
function ativarCliquesCards() {
    const cards = document.querySelectorAll('.exercise-card');
    cards.forEach(card => {
        card.removeEventListener('click', toggleCard);
        card.addEventListener('click', toggleCard);
    });
}

function toggleCard(e) {
    if (e.target.closest('.video-btn')) return;

    this.classList.toggle('completed');
    if (navigator.vibrate) navigator.vibrate(50);
    
    atualizarProgresso();
}

// ================= FUNÇÃO 5: CÁLCULO DE PROGRESSO (ATUALIZADA) =================
function atualizarProgresso() {
    const cards = document.querySelectorAll('.exercise-card');
    const total = cards.length;
    const concluidos = document.querySelectorAll('.exercise-card.completed').length;
    
    const subtitle = document.querySelector('.subtitle');
    
    if (total === 0) return;

    const porcentagem = Math.round((concluidos / total) * 100);
    
    if (concluidos === total) {
        subtitle.innerText = "Parabéns! Treino finalizado! 🎉";
        subtitle.style.color = "#00ffc3";

        // === AQUI ESTÁ A MÁGICA DO SALVAMENTO ===
        // Se ainda não salvou, salva agora
        if (!document.body.classList.contains('treino-salvo')) {
            salvarTreinoConcluido(treinoAtualId);
            document.body.classList.add('treino-salvo'); 
        }

    } else {
        // Se desmarcou, volta o texto ao normal
        if (concluidos > 0) {
            subtitle.innerText = `${porcentagem}% concluído. Continue assim!`;
            subtitle.style.color = "#fff";
        } else {
            subtitle.innerText = "Foco total hoje!";
            subtitle.style.color = "#888";
        }
        document.body.classList.remove('treino-salvo');
    }
}

// ================= FUNÇÃO 6: SALVAR NO BANCO (NOVA) =================
async function salvarTreinoConcluido(treinoId) {
    console.log("Tentando salvar treino...", treinoId);
    
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const { error } = await _supabase
        .from('historico_treinos')
        .insert({
            aluno_id: user.id,
            treino_id: treinoId, 
            duracao_minutos: 45 
        });

    if (error) {
        console.error("Erro ao salvar histórico:", error);
    } else {
        console.log("✅ Treino salvo no histórico com sucesso!");
    }
}

// ================= FUNÇÃO 7: LÓGICA DE VÍDEO (MODAL) =================
function ativarCliquesVideo() {
    const playBtns = document.querySelectorAll('.video-btn');
    const modal = document.getElementById('video-modal');
    const videoFrame = document.getElementById('video-frame');
    const closeBtn = document.querySelector('.close-btn');

    playBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const link = btn.getAttribute('data-link');
            if(modal && videoFrame) {
                videoFrame.src = link;
                modal.classList.add('show');
            }
        });
    });

    if(closeBtn && modal) {
        const fechar = () => {
            modal.classList.remove('show');
            videoFrame.src = ""; 
        };
        closeBtn.onclick = fechar;
        modal.onclick = (e) => { if (e.target === modal) fechar(); };
    }
}