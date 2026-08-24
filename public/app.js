let selectedMediaFile = null;
let selectedAudioFile = null;
let currentProcessId = null;
let selectedModelKey = 'm1';

// Catálogo dos 20 Modelos para Renderização Dinâmica das Previews na Interface
const MODELS_CATALOG = [
    { key: 'm1', name: '1. Bicolor 2 Linhas (Branco/Amarelo)', l1: '#FFFFFF', l2: '#FFFF00', bg: 'transparent' },
    { key: 'm2', name: '2. Bicolor 2 Linhas (Branco/Ciano)', l1: '#FFFFFF', l2: '#00FFFF', bg: 'transparent' },
    { key: 'm3', name: '3. Bicolor 2 Linhas (Branco/Verde Neon)', l1: '#FFFFFF', l2: '#00FF00', bg: 'transparent' },
    { key: 'm4', name: '4. Bicolor 2 Linhas (Branco/Rosa)', l1: '#FFFFFF', l2: '#FF00FF', bg: 'transparent' },
    { key: 'm5', name: '5. Caixa Preta (Texto Branco/Amarelo)', l1: '#FFFFFF', l2: '#FFFF00', bg: '#000000' },
    { key: 'm6', name: '6. Caixa Amarela (Texto Preto)', l1: '#000000', l2: '#000000', bg: '#FFFF00' },
    { key: 'm7', name: '7. Caixa Azul (Texto Branco)', l1: '#FFFFFF', l2: '#FFFFFF', bg: '#0000FF' },
    { key: 'm8', name: '8. Caixa Vermelha (Texto Branco)', l1: '#FFFFFF', l2: '#FFFFFF', bg: '#FF0000' },
    { key: 'm9', name: '9. Neon Verde Brilhante', l1: '#00FF00', l2: '#FFFFFF', bg: 'transparent', glow: '#00FF00' },
    { key: 'm10', name: '10. Neon Ciano Impacto', l1: '#00FFFF', l2: '#FFFFFF', bg: 'transparent', glow: '#00FFFF' },
    { key: 'm11', name: '11. Neon Magenta Vibrante', l1: '#FF00FF', l2: '#FFFFFF', bg: 'transparent', glow: '#FF00FF' },
    { key: 'm12', name: '12. Minimalista Branco Puro', l1: '#FFFFFF', l2: '#E0E0E0', bg: 'transparent' },
    { key: 'm13', name: '13. Minimalista Amarelo Clássico', l1: '#FFFF00', l2: '#FFFFFF', bg: 'transparent' },
    { key: 'm14', name: '14. Contorno Espesso Amarelo', l1: '#FFFF00', l2: '#FFFFFF', bg: 'transparent', border: '2px solid #000' },
    { key: 'm15', name: '15. Contorno Espesso Verde', l1: '#00FF00', l2: '#FFFFFF', bg: 'transparent', border: '2px solid #000' },
    { key: 'm16', name: '16. Sombra Marcante Amarela', l1: '#FFFFFF', l2: '#FFFF00', bg: 'transparent', shadow: '3px 3px 0 #000' },
    { key: 'm17', name: '17. Sombra Marcante Vermelha', l1: '#FFFFFF', l2: '#FF0000', bg: 'transparent', shadow: '3px 3px 0 #000' },
    { key: 'm18', name: '18. Estilo Cinema Dourado', l1: '#FFD700', l2: '#FFFFFF', bg: 'transparent' },
    { key: 'm19', name: '19. Estilo Podcast Roxo/Branco', l1: '#FFFFFF', l2: '#8000FF', bg: 'transparent' },
    { key: 'm20', name: '20. Estilo High Contrast P&B', l1: '#FFFFFF', l2: '#000000', bg: '#FFFFFF' }
];

// DOM Elements
const mediaInput = document.getElementById('mediaInput');
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');

const audioInput = document.getElementById('audioInput');
const audioPlayer = document.getElementById('audioPlayer');
const audioInfoCard = document.getElementById('audioInfoCard');
const audioName = document.getElementById('audioName');
const audioMeta = document.getElementById('audioMeta');

const stylesGrid = document.getElementById('stylesGrid');
const generateBtn = document.getElementById('generateBtn');
const progressWidget = document.getElementById('progressWidget');
const progressPercent = document.getElementById('progressPercent');
const progressStatus = document.getElementById('progressStatus');
const cancelBtn = document.getElementById('cancelBtn');

const resultSection = document.getElementById('resultSection');
const finalVideoPlayer = document.getElementById('finalVideoPlayer');
const downloadBtn = document.getElementById('downloadBtn');

// Renderização dos 20 Cards de Modelo
function renderStyleCards() {
    stylesGrid.innerHTML = '';
    MODELS_CATALOG.forEach((m, idx) => {
        const card = document.createElement('div');
        card.className = `style-card ${idx === 0 ? 'active' : ''}`;
        card.dataset.key = m.key;

        const glowStyle = m.glow ? `text-shadow: 0 0 5px ${m.glow};` : '';
        const shadowStyle = m.shadow ? `text-shadow: ${m.shadow};` : '';

        card.innerHTML = `
            <div class="style-preview-box" style="background: ${m.bg};">
                <p style="color: ${m.l1}; font-weight: bold; ${glowStyle} ${shadowStyle}">Primeira linha de legenda</p>
                <p style="color: ${m.l2}; font-weight: bold; ${glowStyle} ${shadowStyle}">Segunda linha de legenda</p>
            </div>
            <h4 style="font-size: 0.85rem;">${m.name}</h4>
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

// Previews Mídia/Áudio
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

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedAudioFile = file;
    audioPlayer.src = URL.createObjectURL(file);
    audioName.textContent = file.name;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    audioPlayer.onloadedmetadata = () => {
        const durationSec = Math.round(audioPlayer.duration);
        const mins = Math.floor(durationSec / 60);
        const secs = String(durationSec % 60).padStart(2, '0');
        audioMeta.textContent = `${mins}:${secs} | ${sizeMB} MB`;
    };
    audioInfoCard.classList.remove('hidden');
});

// Envio e Processamento via SSE
generateBtn.addEventListener('click', async () => {
    if (!selectedMediaFile || !selectedAudioFile) {
        alert('Selecione a mídia e o áudio antes de prosseguir.');
        return;
    }

    const formData = new FormData();
    formData.append('media', selectedMediaFile);
    formData.append('audio', selectedAudioFile);
    formData.append('styleModel', selectedModelKey);
    formData.append('wordsPerBatch', document.getElementById('wordsPerBatch').value);

    progressWidget.classList.remove('hidden');
    progressPercent.textContent = '0%';
    progressStatus.textContent = 'Iniciando upload...';

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
                    if (data.percent >= 0) {
                        progressPercent.textContent = `${data.percent}%`;
                        progressStatus.textContent = data.message;
                    }
                    if (data.complete) {
                        progressWidget.classList.add('hidden');
                        resultSection.classList.remove('hidden');
                        finalVideoPlayer.src = data.resultUrl;
                        downloadBtn.href = data.resultUrl;
                    }
                }
            }
        }
    } catch (err) {
        alert('Erro de comunicação: ' + err.message);
        progressWidget.classList.add('hidden');
    }
});

// Cancelamento
cancelBtn.addEventListener('click', async () => {
    if (currentProcessId) {
        await fetch('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processId: currentProcessId })
        });
    }
    progressWidget.classList.add('hidden');
    alert('Processamento cancelado com sucesso.');
});
