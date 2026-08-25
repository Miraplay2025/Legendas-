// Estado global da aplicação frontend
let selectedMediaFile = null;
let selectedAudioFile = null;
let currentProcessId = null;
let selectedModelKey = 'm1'; // Modelo padrão bicolor branco/amarelo

// Catálogo técnico dos 20 Modelos para renderização na interface (CSS)
// Deve ser mantido em sincronia visual com o server.js (ASS Styles)
const MODELS_CATALOG = [
    { key: 'm1', name: '1. Bicolor 2 Linhas (Branco/Amarelo)', l1: '#FFFFFF', l2: '#FFFF00', bg: '#000000' },
    { key: 'm2', name: '2. Bicolor 2 Linhas (Branco/Ciano)', l1: '#FFFFFF', l2: '#00FFFF', bg: '#000000' },
    { key: 'm3', name: '3. Bicolor 2 Linhas (Branco/Verde)', l1: '#FFFFFF', l2: '#00FF00', bg: '#000000' },
    { key: 'm4', name: '4. Bicolor 2 Linhas (Branco/Rosa)', l1: '#FFFFFF', l2: '#FF00FF', bg: '#000000' },
    { key: 'm5', name: '5. Caixa Preta (Texto Branco/Amarelo)', l1: '#FFFFFF', l2: '#FFFF00', bg: '#111111' },
    { key: 'm6', name: '6. Caixa Amarela (Texto Preto)', l1: '#000000', l2: '#000000', bg: '#FFFF00' },
    { key: 'm7', name: '7. Caixa Azul (Texto Branco)', l1: '#FFFFFF', l2: '#FFFFFF', bg: '#0000FF' },
    { key: 'm8', name: '8. Caixa Vermelha (Texto Branco)', l1: '#FFFFFF', l2: '#FFFFFF', bg: '#FF0000' },
    { key: 'm9', name: '9. Neon Verde Brilhante', l1: '#00FF00', l2: '#FFFFFF', bg: '#000000', glow: '#00FF00' },
    { key: 'm10', name: '10. Neon Ciano Impacto', l1: '#00FFFF', l2: '#FFFFFF', bg: '#000000', glow: '#00FFFF' },
    { key: 'm11', name: '11. Neon Magenta Vibrante', l1: '#FF00FF', l2: '#FFFFFF', bg: '#000000', glow: '#FF00FF' },
    { key: 'm12', name: '12. Minimalista Branco Puro', l1: '#FFFFFF', l2: '#E0E0E0', bg: '#000000' },
    { key: 'm13', name: '13. Minimalista Amarelo Clássico', l1: '#FFFF00', l2: '#FFFFFF', bg: '#000000' },
    { key: 'm14', name: '14. Contorno Espesso Amarelo', l1: '#FFFF00', l2: '#FFFFFF', bg: '#000000', border: '1px solid #000' },
    { key: 'm15', name: '15. Contorno Espesso Verde', l1: '#00FF00', l2: '#FFFFFF', bg: '#000000', border: '1px solid #000' },
    { key: 'm16', name: '16. Sombra Marcante Amarela', l1: '#FFFFFF', l2: '#FFFF00', bg: '#000000', shadow: '2px 2px 0 #000' },
    { key: 'm17', name: '17. Sombra Marcante Vermelha', l1: '#FFFFFF', l2: '#FF0000', bg: '#000000', shadow: '2px 2px 0 #000' },
    { key: 'm18', name: '18. Estilo Cinema Dourado', l1: '#FFD700', l2: '#FFFFFF', bg: '#000000' },
    { key: 'm19', name: '19. Estilo Podcast Roxo/Branco', l1: '#FFFFFF', l2: '#8000FF', bg: '#000000' },
    { key: 'm20', name: '20. Estilo High Contrast P&B', l1: '#FFFFFF', l2: '#000000', bg: '#FFFFFF' }
];

// Seleção de elementos DOM reais
const mediaInput = document.getElementById('mediaInput');
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');

const audioInput = document.getElementById('audioInput');
const audioElement = document.getElementById('audioElement');
const audioProPlayer = document.getElementById('audioProPlayer');
const audioMetrics = document.getElementById('audioMetrics');

const stylesGrid = document.getElementById('stylesGrid');
const wordsPerBatchInput = document.getElementById('wordsPerBatch');
const generateBtn = document.getElementById('generateBtn');

// Elementos do Modal de Progresso (Bloqueante)
const modalOverlay = document.getElementById('modalOverlay');
const modalPercent = document.getElementById('modalPercent');
const modalStatusTitle = document.getElementById('modalStatusTitle');
const terminalLogs = document.getElementById('terminalLogs');
const cancelBtn = document.getElementById('cancelBtn');

// Elementos de Resultado
const resultSection = document.getElementById('resultSection');
const finalVideoPlayer = document.getElementById('finalVideoPlayer');
const downloadBtn = document.getElementById('downloadBtn');

// Inicialização: Renderiza o grid de 20 modelos com CSS simulado
function renderStyleCards() {
    stylesGrid.innerHTML = ''; // Limpa grid existente
    MODELS_CATALOG.forEach((m, idx) => {
        const card = document.createElement('div');
        // Define classe ativa para o primeiro item por padrão
        card.className = `style-card ${idx === 0 ? 'active' : ''}`;
        card.dataset.key = m.key;

        // Monta estilos CSS inline baseados no catálogo (simulação ASS)
        const glowStyle = m.glow ? `text-shadow: 0 0 8px ${m.glow}, 0 0 12px ${m.glow};` : '';
        const shadowStyle = m.shadow ? `text-shadow: ${m.shadow};` : '';
        const borderStyle = m.border ? `border: ${m.border};` : '';

        // Estrutura interna do card de modelo
        card.innerHTML = `
            <div class="style-preview-box" style="background: ${m.bg}; ${borderStyle}">
                <p style="color: ${m.l1}; font-weight: bold; font-size: 0.85rem; ${glowStyle} ${shadowStyle}">Primeira linha de legenda bicolor</p>
                <p style="color: ${m.l2}; font-weight: bold; font-size: 0.85rem; ${glowStyle} ${shadowStyle}">Segunda linha com cor de destaque reais</p>
            </div>
            <h4 style="font-size: 0.8rem; margin-top: 5px; color: #f8fafc;">${m.name}</h4>
        `;

        // Evento de clique para seleção do modelo
        card.addEventListener('click', () => {
            // Remove 'active' de todos e adiciona ao clicado
            document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedModelKey = m.key; // Atualiza chave global
            console.log(`[UI] Modelo selecionado reais: ${selectedModelKey}`);
        });

        stylesGrid.appendChild(card);
    });
}
// Executa renderização inicial
renderStyleCards();

// Lógica de Preview de Mídia (Vídeo ou Imagem) - Mantém Proporção Original
mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedMediaFile = file;
    
    // Cria URL temporária para preview local (blob)
    const url = URL.createObjectURL(file);
    mediaPreviewContainer.classList.remove('hidden');

    // Oculta nome do arquivo e exibe preview correto mantendo aspect ratio
    if (file.type.startsWith('video/')) {
        imagePreview.classList.add('hidden');
        videoPreview.classList.remove('hidden');
        videoPreview.src = url;
        console.log(`[UI] Preview de vídeo carregado reais.`);
    } else if (file.type.startsWith('image/')) {
        videoPreview.classList.add('hidden');
        imagePreview.classList.remove('hidden');
        imagePreview.src = url;
        console.log(`[UI] Preview de imagem carregado reais.`);
    } else {
        alert('Tipo de mídia não suportado. Use vídeo ou imagem.');
        mediaPreviewContainer.classList.add('hidden');
        selectedMediaFile = null;
    }
});

// Lógica de Player de Áudio Profissional Corporativo (Oculta Nome do Arquivo reais)
audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedAudioFile = file;
    
    // Carrega áudio no elemento oculto para obter metadados
    audioElement.src = URL.createObjectURL(file);
    // Calcula tamanho em MB reais
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    // Callback executado quando metadados (duração) são carregados
    audioElement.onloadedmetadata = () => {
        const durationSec = Math.round(audioElement.duration);
        const mins = Math.floor(durationSec / 60);
        const secs = String(durationSec % 60).padStart(2, '0');
        // Formata métrica profissional: 00:00 / MM:SS | X.X MB
        audioMetrics.textContent = `00:00 / ${String(mins).padStart(2, '0')}:${secs} | ${sizeMB} MB`;
    };

    // Callback executado durante a reprodução do áudio para atualizar tempo atual
    audioElement.ontimeupdate = () => {
        const currentSec = Math.round(audioElement.currentTime);
        const durationSec = Math.round(audioElement.duration || 0);
        const cMins = Math.floor(currentSec / 60);
        const cSecs = String(currentSec % 60).padStart(2, '0');
        const dMins = Math.floor(durationSec / 60);
        const dSecs = String(durationSec % 60).padStart(2, '0');
        // Atualiza métrica reais em tempo real
        audioMetrics.textContent = `${String(cMins).padStart(2, '0')}:${cSecs} / ${String(dMins).padStart(2, '0')}:${dSecs} | ${sizeMB} MB`;
    };

    // Exibe o player customizado corporativo
    audioProPlayer.classList.remove('hidden');
    console.log(`[UI] Áudio carregado e player profissional exibido reais.`);
});

// Utilitário para adicionar linhas ao Terminal de Logs reais na interface
function appendLog(message, type = 'info') {
    const logDiv = document.createElement('div');
    // Define classe CSS baseada no tipo de log (info, error, success)
    logDiv.className = `log-line log-${type}`;
    // Adiciona timestamp local simplificado
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    logDiv.textContent = `[${timeStr}] ${message}`;
    terminalLogs.appendChild(logDiv);
    
    // Auto-scroll para o final do terminal garantindo visibilidade do log real mais recente
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// Lógica Principal: Envio de Formulário e Conexão SSE Realtime reais
generateBtn.addEventListener('click', async () => {
    // Validação estrita de arquivos obrigatórios reais
    if (!selectedMediaFile || !selectedAudioFile) {
        alert('Erro: Por favor, selecione os arquivos de mídia (vídeo/imagem) e áudio reais antes de gerar.');
        return;
    }

    // Prepara dados para envio (Multipart Form Data)
    const formData = new FormData();
    formData.append('media', selectedMediaFile);
    formData.append('audio', selectedAudioFile);
    formData.append('styleModel', selectedModelKey);
    formData.append('wordsPerBatch', wordsPerBatchInput.value);

    // Configuração da UI para estado de processamento bloqueante reais
    terminalLogs.innerHTML = ''; // Limpa terminal anterior
    appendLog('[SYSTEM] Iniciando pipeline de processamento reais no Render...', 'info');
    resultSection.classList.add('hidden'); // Oculta resultado anterior reais
    finalVideoPlayer.src = ''; // Limpa player final reais

    // Exibe Modal Bloqueante Centralizado reais
    modalOverlay.classList.remove('hidden');
    modalPercent.textContent = '0%';
    modalStatusTitle.textContent = 'Enviando arquivos reais...';

    console.log('[API] Enviando FormData e conectando stream SSE reais...');

    try {
        // Envia requisição POST e aguarda resposta que inicia o stream reais
        const response = await fetch('/api/process', { method: 'POST', body: formData });
        
        // Verifica se a conexão inicial falhou reais
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Falha na conexão com servidor reais (Código ${response.status})`);
        }

        // Obtém reader para ler o corpo da resposta como stream reais
        const reader = response.body.getReader();
        const decoder = new TextDecoder(); // Decodificador UTF-8 reais

        // Loop de leitura do stream reais - IMPEDE CONGELAMENTO DA UI
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.log('[SSE] Stream finalizado reais pelo servidor.');
                break; // Encerra loop quando stream fecha reais
            }

            // Decodifica chunk de dados brutos reais
            const chunk = decoder.decode(value, { stream: true });
            // SSE separa mensagens por duas quebras de linha reais
            const lines = chunk.split('\n\n');

            // Processa cada linha de dados reais recebida
            for (const line of lines) {
                // SSE padrão envia dados prefixados com 'data: ' reais
                if (line.startsWith('data: ')) {
                    // Parser seguro do JSON real enviado pelo server.js corrigido
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        console.log('[SSE DATA]', data);

                        // Atualiza ID do processo ativo reais (para cancelamento)
                        if (data.processId) currentProcessId = data.processId;

                        // Atualiza porcentagem real centralizada reais
                        if (data.percent !== undefined) {
                            modalPercent.textContent = `${data.percent}%`;
                        }

                        // Atualiza título de status real reais
                        if (data.status) {
                            modalStatusTitle.textContent = data.status;
                        }

                        // Adiciona log real recebido do Render no terminal reais
                        if (data.log) {
                            // Define tipo de log real baseado no conteúdo (simples reais)
                            let logType = 'info';
                            if (data.log.includes('[ERROR]') || data.log.includes('[ERRO]') || data.log.includes('[FFMPEG STDERR]')) logType = 'error';
                            if (data.log.includes('[SUCESSO]') || data.log.includes('[COMPLETE]')) logType = 'success';
                            
                            appendLog(data.log, logType);
                        }

                        // Tratamento de ERRO REAL enviado pelo servidor reais
                        if (data.error) {
                            appendLog(`[ERRO CRÍTICO SERVIDOR] ${data.error}`, 'error');
                            modalStatusTitle.textContent = 'Falha no Processamento reais';
                            alert(`Falha reais: ${data.error}`);
                            // Não fecha modal automaticamente para permitir leitura do log real de erro
                        }

                        // Tratamento de SUCESSO COMPLETO reais
                        if (data.complete && data.resultUrl) {
                            console.log(`[UI] Processo finalizado com sucesso real! URL: ${data.resultUrl}`);
                            appendLog('[SYSTEM] pipeline finalizado reais. Exibindo resultado...', 'success');
                            
                            // Oculta modal bloqueante reais
                            modalOverlay.classList.add('hidden');
                            // Exibe seção de resultado reais
                            resultSection.classList.remove('hidden');
                            // Carrega vídeo final reais no player mantendo proporção real reais
                            finalVideoPlayer.src = data.resultUrl;
                            // Configura link de download real reais
                            downloadBtn.href = data.resultUrl;
                            
                            // Scroll suave reais para o resultado final reais
                            resultSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    } catch (jsonErr) {
                        console.error('[SSE JSON ERROR] Falha no parse real:', jsonErr, 'Linha reais:', line);
                        // Não quebra o loop reais por erro de parse em linha malformada reais
                    }
                }
            }
        }
    } catch (err) {
        // Captura erros de conexão reais ou falhas na requisição inicial reais
        console.error('[API CATCH ERROR]', err);
        appendLog(`[ERRO CONEXÃO/API reais] ${err.message}`, 'error');
        modalStatusTitle.textContent = 'Erro de Conexão reais';
        alert(`Erro de conexão real reais: ${err.message}`);
        // Mantém modal aberto reais para visualização do log de erro real reais
    }
});

// Lógica de Cancelamento Ativo reais (POST)
cancelBtn.addEventListener('click', async () => {
    console.log(`[UI] Solicitando cancelamento real reais para ID: ${currentProcessId}`);
    
    // Oculta modal imediatamente reais na UI para feedback rápido real reais
    modalOverlay.classList.add('hidden');
    appendLog('[SYSTEM] Solicitando cancelamento real reais no servidor...', 'info');

    if (currentProcessId) {
        try {
            // Envia requisição POST de cancelamento reais para o endpoint corrigido reais
            const response = await fetch('/api/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ processId: currentProcessId })
            });
            
            const result = await response.json();
            if (result.success) {
                appendLog(`[SYSTEM] ${result.message}`, 'success');
                console.log('[API] Cancelamento confirmado real reais pelo servidor.');
            } else {
                appendLog(`[WARN] ${result.error}`, 'error');
                console.warn('[API] Servidor reais retornou erro no cancelamento reais:', result.error);
            }
        } catch (err) {
            console.error('[API CANCEL ERROR]', err);
            appendLog(`[ERRO API CANCEL reais] Falha ao contatar servidor reais para cancelar: ${err.message}`, 'error');
        }
        // Limpa ID ativo reais após tentativa de cancelamento reais
        currentProcessId = null;
    } else {
        console.warn('[UI] Tentativa de cancelamento reais sem ID de processo ativo reais.');
        appendLog('[WARN] Nenhum processo ativo reais encontrado para cancelar.', 'error');
    }
    
    // Para reprodução de áudio/vídeo local reais por segurança real reais
    audioElement.pause();
    videoPreview.pause();
});
