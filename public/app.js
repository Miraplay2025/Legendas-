let selectedMediaFile = null;
let selectedAudioFile = null;
let currentProcessId = null;
let selectedModelKey = 'm1';

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
    { key: 'm14', name: '14. Contorno Espesso Amarelo', l1: '#FFFF00', l2: '#FFFFFF', bg: '#000000' },
    { key: 'm15', name: '15. Contorno Espesso Verde', l1: '#00FF00', l2: '#FFFFFF', bg: '#000000' },
    { key: 'm16', name: '16. Sombra Marcante Amarela', l1: '#FFFFFF', l2: '#FFFF00', bg: '#000000' },
    { key: 'm17', name: '17. Sombra Marcante Vermelha', l1: '#FFFFFF', l2: '#FF0000', bg: '#000000' },
    { key: 'm18', name: '18. Estilo Cinema Dourado', l1: '#FFD700', l2: '#FFFFFF', bg: '#000000' },
    { key: 'm19', name: '19. Estilo Podcast Roxo/Branco', l1: '#FFFFFF', l2: '#8000FF', bg: '#000000' },
    { key: 'm20', name: '20. Estilo High Contrast P&B', l1: '#FFFFFF', l2: '#000000', bg: '#FFFFFF' }
];

const mediaInput = document.getElementById('mediaInput');
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');

const audioInput = document.getElementById('audioInput');
const audioElement = document.getElementById('audioElement');
const audioProPlayer = document.getElementById('audioProPlayer');
const audioMetrics = document.getElementById('audioMetrics');

const stylesGrid = document.getElementById('stylesGrid');
const generateBtn = document.getElementById('generateBtn');

const modalOverlay = document.getElementById('modalOverlay');
const modalPercent = document.getElementById('modalPercent');
const modalStatusTitle = document.getElementById('modalStatusTitle');
const terminalLogs = document.getElementById('terminalLogs');
const cancelBtn = document.getElementById('cancelBtn');

const resultSection = document.getElementById('resultSection');
const finalVideoPlayer = document.getElementById('finalVideoPlayer');
const downloadBtn = document.getElementById('downloadBtn');

function renderStyleCards() {
    stylesGrid.innerHTML = '';
    MODELS_CATALOG.forEach((m, idx) => {
        const card = document.createElement('div');
        card.className = `style-card ${idx === 0 ? 'active' : ''}`;
        card.dataset.key = m.key;

        const glowStyle = m.glow ? `text-shadow: 0 0 5px ${m.glow};` : '';

        card.innerHTML = `
            <div class="style-preview-box" style="background: ${m.bg};">
                <p style="color: ${m.l1}; font-weight: bold; font-size: 0.8rem; ${glowStyle}">Primeira linha de legenda</p>
                <p style="color: ${m.l2}; font-weight: bold; font-size: 0.8rem; ${glowStyle}">Segunda linha de legenda</p>
            </div>
            <h4 style="font-size: 0.8rem;">${m.name}</h4>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedModelKey = m.key;
        });

        stylesGrid.appendChild(card);
    });
}
renderStyleCards();

mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedMediaFile = file;
    const url = URL.createObjectURL(file);
    mediaPreviewContainer.classList.remove('hidden');

    if (file.type.startsWith('video/')) {
        imagePreview.classList.add('hidden');
        videoPreview.classList.remove('hidden');
        videoPreview.src = url;
    } else {
        videoPreview.classList.add('hidden');
        imagePreview.classList.remove('hidden');
        imagePreview.src = url;
    }
});

// Player Profissional de Áudio (Oculta o Nome do Arquivo)
audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedAudioFile = file;
    audioElement.src = URL.createObjectURL(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    audioElement.onloadedmetadata = () => {
        const durationSec = Math.round(audioElement.duration);
        const mins = Math.floor(durationSec / 60);
        const secs = String(durationSec % 60).padStart(2, '0');
        audioMetrics.textContent = `00:00 / ${String(mins).padStart(2, '0')}:${secs} | ${sizeMB} MB`;
    };

    audioElement.ontimeupdate = () => {
        const currentSec = Math.round(audioElement.currentTime);
        const durationSec = Math.round(audioElement.duration || 0);
        const cMins = Math.floor(currentSec / 60);
        const cSecs = String(currentSec % 60).padStart(2, '0');
        const dMins = Math.floor(durationSec / 60);
        const dSecs = String(durationSec % 60).padStart(2, '0');
        audioMetrics.textContent = `${String(cMins).padStart(2, '0')}:${cSecs} / ${String(dMins).padStart(2, '0')}:${dSecs} | ${sizeMB} MB`;
    };

    audioProPlayer.classList.remove('hidden');
});

function appendLog(message, isError = false) {
    const logDiv = document.createElement('div');
    logDiv.className = isError ? 'log-line log-error' : 'log-line';
    logDiv.textContent = message;
    terminalLogs.appendChild(logDiv);
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

generateBtn.addEventListener('click', async () => {
    if (!selectedMediaFile || !selectedAudioFile) {
        alert('Selecione os arquivos de mídia e áudio.');
        return;
    }

    const formData = new FormData();
    formData.append('media', selectedMediaFile);
    formData.append('audio', selectedAudioFile);
    formData.append('styleModel', selectedModelKey);
    formData.append('wordsPerBatch', document.getElementById('wordsPerBatch').value);

    // Exibe Modal Bloqueante e Limpa Terminal
    terminalLogs.innerHTML = '';
    appendLog('[SYSTEM] Conectando ao servidor no Render...');
    modalOverlay.classList.remove('hidden');
    modalPercent.textContent = '0%';
    modalStatusTitle.textContent = 'Enviando mídia...';

    try {
        const response = await fetch('/api/process', { method: 'POST', body: formData });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.replace('data: ', ''));

                    if (data.processId) currentProcessId = data.processId;

                    if (data.percent !== undefined) {
                        modalPercent.textContent = `${data.percent}%`;
                    }

                    if (data.status) {
                        modalStatusTitle.textContent = data.status;
                    }

                    if (data.log) {
                        appendLog(data.log);
                    }

                    if (data.error) {
                        appendLog(data.error, true);
                        modalStatusTitle.textContent = 'Falha no Processamento';
                    }

                    if (data.complete) {
                        modalOverlay.classList.add('hidden');
                        resultSection.classList.remove('hidden');
                        finalVideoPlayer.src = data.resultUrl;
                        downloadBtn.href = data.resultUrl;
                    }
                }
            }
        }
    } catch (err) {
        appendLog(`[ERRO CONEXÃO] ${err.message}`, true);
        modalStatusTitle.textContent = 'Erro de Conexão';
    }
});

cancelBtn.addEventListener('click', async () => {
    if (currentProcessId) {
        await fetch('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processId: currentProcessId })
        });
    }
    modalOverlay.classList.add('hidden');
    alert('Processo cancelado.');
});
