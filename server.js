const express = require('express');
const multer = require('multer');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Armazenamento de processos ativos para suporte ao cancelamento
const activeProcesses = new Map();

// Configuração do Multer para recebimento de uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage });

/**
 * Definição dos 20 Modelos de Legenda no formato de estilos ASS
 */
const CAPTION_MODELS = {
    'm1': { name: 'Bicolor 2 Linhas (Branco/Amarelo)', primary: '&H00FFFFFF', secondary: '&H0000FFFF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 2, shadowW: 1 },
    'm2': { name: 'Bicolor 2 Linhas (Branco/Ciano)', primary: '&H00FFFFFF', secondary: '&H00FFFF00', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 2, shadowW: 1 },
    'm3': { name: 'Bicolor 2 Linhas (Branco/Verde Neon)', primary: '&H00FFFFFF', secondary: '&H0000FF00', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 2, shadowW: 1 },
    'm4': { name: 'Bicolor 2 Linhas (Branco/Rosa)', primary: '&H00FFFFFF', secondary: '&H00FF00FF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 2, shadowW: 1 },
    'm5': { name: 'Caixa Preta com Texto Branco/Amarelo', primary: '&H00FFFFFF', secondary: '&H0000FFFF', outline: '&H00000000', back: '&H00000000', borderStyle: 3, outlineW: 2, shadowW: 0 },
    'm6': { name: 'Caixa Amarela com Texto Preto', primary: '&H00000000', secondary: '&H00000000', outline: '&H00000000', back: '&H0000FFFF', borderStyle: 3, outlineW: 2, shadowW: 0 },
    'm7': { name: 'Caixa Azul com Texto Branco', primary: '&H00FFFFFF', secondary: '&H00FFFFFF', outline: '&H00000000', back: '&H00FF0000', borderStyle: 3, outlineW: 2, shadowW: 0 },
    'm8': { name: 'Caixa Vermelha com Texto Branco', primary: '&H00FFFFFF', secondary: '&H00FFFFFF', outline: '&H00000000', back: '&H000000FF', borderStyle: 3, outlineW: 2, shadowW: 0 },
    'm9': { name: 'Neon Verde Brilhante', primary: '&H0000FF00', secondary: '&H00FFFFFF', outline: '&H00005500', back: '&H80000000', borderStyle: 1, outlineW: 4, shadowW: 2 },
    'm10': { name: 'Neon Ciano Impacto', primary: '&H00FFFF00', secondary: '&H00FFFFFF', outline: '&H00555500', back: '&H80000000', borderStyle: 1, outlineW: 4, shadowW: 2 },
    'm11': { name: 'Neon Magenta Vibrante', primary: '&H00FF00FF', secondary: '&H00FFFFFF', outline: '&H00550055', back: '&H80000000', borderStyle: 1, outlineW: 4, shadowW: 2 },
    'm12': { name: 'Minimalista Branco Puro', primary: '&H00FFFFFF', secondary: '&H00E0E0E0', outline: '&H00000000', back: '&H00000000', borderStyle: 1, outlineW: 1, shadowW: 0 },
    'm13': { name: 'Minimalista Amarelo Clássico', primary: '&H0000FFFF', secondary: '&H00FFFFFF', outline: '&H00000000', back: '&H00000000', borderStyle: 1, outlineW: 1, shadowW: 0 },
    'm14': { name: 'Contorno Espesso Preto e Amarelo', primary: '&H0000FFFF', secondary: '&H00FFFFFF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 5, shadowW: 0 },
    'm15': { name: 'Contorno Espesso Preto e Verde', primary: '&H0000FF00', secondary: '&H00FFFFFF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 5, shadowW: 0 },
    'm16': { name: 'Sombra Marcante Amarela/Branca', primary: '&H00FFFFFF', secondary: '&H0000FFFF', outline: '&H00000000', back: '&H00000000', borderStyle: 1, outlineW: 1, shadowW: 4 },
    'm17': { name: 'Sombra Marcante Vermelha', primary: '&H00FFFFFF', secondary: '&H000000FF', outline: '&H00000000', back: '&H00000000', borderStyle: 1, outlineW: 1, shadowW: 4 },
    'm18': { name: 'Estilo Cinema Dourado', primary: '&H0022D4FF', secondary: '&H00FFFFFF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 2, shadowW: 2 },
    'm19': { name: 'Estilo Podcast Roxo/Branco', primary: '&H00FFFFFF', secondary: '&H00FF0080', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineW: 3, shadowW: 1 },
    'm20': { name: 'Estilo High Contrast P&B', primary: '&H00FFFFFF', secondary: '&H00000000', outline: '&H00000000', back: '&H00FFFFFF', borderStyle: 3, outlineW: 3, shadowW: 0 }
};

function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (err, stdout) => {
            if (err) return reject(err);
            resolve(parseFloat(stdout.trim()));
        });
    });
}

function convertVttToAssStyle(vttPath, assPath, styleOptions) {
    const content = fs.readFileSync(vttPath, 'utf-8');
    const lines = content.split('\n');

    const config = CAPTION_MODELS[styleOptions.modelKey] || CAPTION_MODELS['m1'];

    let assHeader = `[Script Info]
Title: Auto Captions Modern 20 Models
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Line1,DejaVu Sans,24,${config.primary},${config.outline},${config.outline},${config.back},-1,0,0,0,100,100,0,0,${config.borderStyle},${config.outlineW},${config.shadowW},2,10,10,55,1
Style: Line2,DejaVu Sans,24,${config.secondary},${config.outline},${config.outline},${config.back},-1,0,0,0,100,100,0,0,${config.borderStyle},${config.outlineW},${config.shadowW},2,10,10,25,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    let events = [];
    let currentCue = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('-->')) {
            const times = line.split('-->').map(t => t.trim());
            currentCue = { start: times[0], end: times[1], text: '' };
        } else if (currentCue && line !== '' && !line.startsWith('WEBVTT')) {
            currentCue.text += (currentCue.text ? ' ' : '') + line;
            if (i === lines.length - 1 || lines[i + 1].trim() === '') {
                const words = currentCue.text.split(' ');
                const maxWords = styleOptions.wordsPerBatch || 6;
                
                for (let w = 0; w < words.length; w += maxWords) {
                    const batchWords = words.slice(w, w + maxWords);
                    const mid = Math.ceil(batchWords.length / 2);
                    const line1Text = batchWords.slice(0, mid).join(' ');
                    const line2Text = batchWords.slice(mid).join(' ');

                    const startASS = currentCue.start.replace('.', ',');
                    const endASS = currentCue.end.replace('.', ',');

                    if (line1Text) {
                        events.push(`Dialogue: 0,${startASS},${endASS},Line1,,0,0,0,,${line1Text}`);
                    }
                    if (line2Text) {
                        events.push(`Dialogue: 0,${startASS},${endASS},Line2,,0,0,0,,${line2Text}`);
                    }
                }
                currentCue = null;
            }
        }
    }

    fs.writeFileSync(assPath, assHeader + events.join('\n'));
}

app.post('/api/process', upload.fields([{ name: 'media' }, { name: 'audio' }]), async (req, res) => {
    const processId = Date.now().toString();

    try {
        if (!req.files || !req.files.media || !req.files.audio) {
            return res.status(400).json({ error: 'Arquivos de mídia e áudio são obrigatórios.' });
        }

        const mediaFile = req.files.media[0];
        const audioFile = req.files.audio[0];
        const { styleModel, wordsPerBatch } = req.body;

        const outputDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputVideoPath = path.join(outputDir, `final_${processId}.mp4`);
        const isImage = mediaFile.mimetype.startsWith('image/');
        const audioDuration = await getAudioDuration(audioFile.path);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendProgress = (percent, message) => {
            res.write(`data: ${JSON.stringify({ processId, percent, message })}\n\n`);
        };

        sendProgress(10, 'Iniciando transcrição com OpenAI Whisper...');

        const vttOutputDir = path.join(__dirname, 'uploads');
        const whisperProc = spawn('whisper', [
            audioFile.path,
            '--model', 'tiny',
            '--output_format', 'vtt',
            '--output_dir', vttOutputDir
        ]);

        activeProcesses.set(processId, { whisperProc, ffmpegProc: null });

        whisperProc.stdout.on('data', (data) => {
            sendProgress(35, `Transcrevendo: ${data.toString().substring(0, 30)}...`);
        });

        whisperProc.on('close', async (code) => {
            if (code !== 0) {
                sendProgress(-1, 'Erro durante a transcrição.');
                return res.end();
            }

            sendProgress(65, 'Transcrição concluída. Aplicando modelo selecionado...');

            const generatedVttPath = path.join(vttOutputDir, `${path.basename(audioFile.path)}.vtt`);
            const assPath = path.join(vttOutputDir, `${processId}.ass`);

            convertVttToAssStyle(generatedVttPath, assPath, {
                modelKey: styleModel,
                wordsPerBatch: parseInt(wordsPerBatch) || 6
            });

            sendProgress(80, 'Compilando vídeo e renderizando legendas com FFmpeg...');

            let ffmpegArgs = [];
            if (isImage) {
                ffmpegArgs = [
                    '-loop', '1',
                    '-i', mediaFile.path,
                    '-i', audioFile.path,
                    '-vf', `subtitles=${assPath}`,
                    '-c:v', 'libx264',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-t', audioDuration.toString(),
                    '-y',
                    outputVideoPath
                ];
            } else {
                ffmpegArgs = [
                    '-i', mediaFile.path,
                    '-i', audioFile.path,
                    '-filter_complex', `[0:v][1:a]concat=n=1:v=1:a=1[v][a];[v]subtitles=${assPath}[outv]`,
                    '-map', '[outv]',
                    '-map', '[a]',
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-y',
                    outputVideoPath
                ];
            }

            const ffmpegProc = spawn('ffmpeg', ffmpegArgs);
            activeProcesses.get(processId).ffmpegProc = ffmpegProc;

            ffmpegProc.on('close', (ffmpegCode) => {
                activeProcesses.delete(processId);
                if (ffmpegCode === 0) {
                    sendProgress(100, 'Vídeo finalizado com sucesso!');
                    res.write(`data: ${JSON.stringify({ complete: true, resultUrl: `/outputs/final_${processId}.mp4` })}\n\n`);
                } else {
                    sendProgress(-1, 'Erro durante a renderização no FFmpeg.');
                }
                res.end();
            });
        });

    } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

app.post('/api/cancel', (req, res) => {
    const { processId } = req.body;
    if (activeProcesses.has(processId)) {
        const procGroup = activeProcesses.get(processId);
        if (procGroup.whisperProc) procGroup.whisperProc.kill('SIGKILL');
        if (procGroup.ffmpegProc) procGroup.ffmpegProc.kill('SIGKILL');
        activeProcesses.delete(processId);
        return res.json({ success: true, message: 'Processo cancelado.' });
    }
    res.status(404).json({ error: 'Processo não encontrado.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
