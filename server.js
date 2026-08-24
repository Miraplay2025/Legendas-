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

const activeProcesses = new Map();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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

                    if (line1Text) events.push(`Dialogue: 0,${startASS},${endASS},Line1,,0,0,0,,${line1Text}`);
                    if (line2Text) events.push(`Dialogue: 0,${startASS},${endASS},Line2,,0,0,0,,${line2Text}`);
                }
                currentCue = null;
            }
        }
    }

    fs.writeFileSync(assPath, assHeader + events.join('\n'));
}

app.post('/api/process', upload.fields([{ name: 'media' }, { name: 'audio' }]), async (req, res) => {
    const processId = Date.now().toString();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendData = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
        if (!req.files || !req.files.media || !req.files.audio) {
            sendData({ error: 'Erro: Selecione a mídia e o áudio obrigatórios.' });
            return res.end();
        }

        const mediaFile = req.files.media[0];
        const audioFile = req.files.audio[0];
        const { styleModel, wordsPerBatch } = req.body;

        const outputDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputVideoPath = path.join(outputDir, `final_${processId}.mp4`);
        const isImage = mediaFile.mimetype.startsWith('image/');

        sendData({ processId, percent: 5, status: 'Analizando duração do áudio...', log: '[INFO] Arquivos recebidos no servidor Render.' });

        const audioDuration = await getAudioDuration(audioFile.path).catch(err => {
            sendData({ error: `[ERRO FFPROBE] Falha ao obter duração: ${err.message}` });
            throw err;
        });

        sendData({ percent: 15, status: 'Iniciando Whisper AI...', log: `[SYSTEM] Áudio verificado. Duração total: ${audioDuration.toFixed(2)}s.` });

        const vttOutputDir = path.join(__dirname, 'uploads');
        const whisperProc = spawn('whisper', [
            audioFile.path,
            '--model', 'tiny',
            '--output_format', 'vtt',
            '--output_dir', vttOutputDir
        ]);

        activeProcesses.set(processId, { whisperProc, ffmpegProc: null });

        whisperProc.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) sendData({ percent: 35, status: 'Transcrevendo áudio...', log: `[WHISPER STDOUT] ${msg}` });
        });

        whisperProc.stdout.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) sendData({ percent: 45, status: 'Processando texto...', log: `[WHISPER LOG] ${msg}` });
        });

        whisperProc.on('error', (err) => {
            sendData({ error: `[ERRO WHISPER EXEC] ${err.message}` });
            activeProcesses.delete(processId);
            res.end();
        });

        whisperProc.on('close', async (code) => {
            if (code !== 0) {
                sendData({ error: `[ERRO WHISPER] Processo finalizado com código de falha ${code}.` });
                activeProcesses.delete(processId);
                return res.end();
            }

            sendData({ percent: 70, status: 'Gerando arquivo de legendas...', log: '[INFO] Transcrição concluída. Aplicando estilo de 2 linhas...' });

            const generatedVttPath = path.join(vttOutputDir, `${path.basename(audioFile.path)}.vtt`);
            const assPath = path.join(vttOutputDir, `${processId}.ass`);

            try {
                convertVttToAssStyle(generatedVttPath, assPath, {
                    modelKey: styleModel,
                    wordsPerBatch: parseInt(wordsPerBatch) || 6
                });
            } catch (styleErr) {
                sendData({ error: `[ERRO ASS FORMATTER] ${styleErr.message}` });
                activeProcesses.delete(processId);
                return res.end();
            }

            sendData({ percent: 80, status: 'Renderizando vídeo via FFmpeg...', log: '[FFMPEG] Gravando legendas dinâmicas no vídeo final...' });

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
            const processRef = activeProcesses.get(processId);
            if (processRef) processRef.ffmpegProc = ffmpegProc;

            ffmpegProc.stderr.on('data', (data) => {
                const logMsg = data.toString().trim();
                if (logMsg.includes('time=')) {
                    sendData({ percent: 90, status: 'Compilando arquivo final...', log: `[FFMPEG PROGRESS] ${logMsg.substring(0, 80)}` });
                }
            });

            ffmpegProc.on('error', (err) => {
                sendData({ error: `[ERRO FFMPEG EXEC] ${err.message}` });
                activeProcesses.delete(processId);
                res.end();
            });

            ffmpegProc.on('close', (ffmpegCode) => {
                activeProcesses.delete(processId);
                if (ffmpegCode === 0) {
                    sendData({ percent: 100, complete: true, resultUrl: `/outputs/final_${processId}.mp4`, log: '[SUCESSO] Vídeo gerado com sucesso!' });
                } else {
                    sendData({ error: `[ERRO FFMPEG] Falha na renderização. Código final: ${ffmpegCode}` });
                }
                res.end();
            });
        });

    } catch (err) {
        sendData({ error: `[ERRO INTERNO] ${err.message}` });
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
        return res.json({ success: true, message: 'Processo cancelado no servidor.' });
    }
    res.status(404).json({ error: 'Processo não encontrado.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
