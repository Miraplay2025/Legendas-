const express = require('express');
const multer = require('multer');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
// Porta configurada para o Render (process.env.PORT) ou 3000 localmente
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve arquivos estáticos da pasta public (frontend)
app.use(express.static('public'));
// Serve os vídeos gerados na pasta outputs
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Armazena processos ativos para permitir cancelamento
const activeProcesses = new Map();

// Configuração do Multer: Armazenamento temporário com nomes únicos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Gera nome único para evitar conflitos de cache e sobrescrita
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(7);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Definição técnica dos 20 modelos de legenda (Formato ASS)
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

// Obtém duração do áudio via FFprobe (essencial para imagens estáticas)
function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (err, stdout) => {
            if (err) return reject(err);
            resolve(parseFloat(stdout.trim()));
        });
    });
}

// Converte VTT (Whisper) para ASS estilizado (2 linhas, cores, quebra de palavras)
function convertVttToAssStyle(vttPath, assPath, styleOptions) {
    if (!fs.existsSync(vttPath)) throw new Error(`Arquivo VTT não encontrado: ${vttPath}`);
    const content = fs.readFileSync(vttPath, 'utf-8');
    const lines = content.split('\n');
    const config = CAPTION_MODELS[styleOptions.modelKey] || CAPTION_MODELS['m1'];

    // Cabeçalho ASS com definição dos dois estilos de linha
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

    // Parser simples de VTT para extrair tempos e texto
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('-->')) {
            const times = line.split('-->').map(t => t.trim());
            currentCue = { start: times[0], end: times[1], text: '' };
        } else if (currentCue && line !== '' && !line.startsWith('WEBVTT')) {
            currentCue.text += (currentCue.text ? ' ' : '') + line;
            // Se a próxima linha for vazia ou fim do arquivo, processa o cue
            if (i === lines.length - 1 || lines[i + 1].trim() === '') {
                const words = currentCue.text.split(' ');
                const maxWords = styleOptions.wordsPerBatch || 6;
                
                // Divide o texto em lotes de palavras para exibição dinâmica
                for (let w = 0; w < words.length; w += maxWords) {
                    const batchWords = words.slice(w, w + maxWords);
                    const mid = Math.ceil(batchWords.length / 2);
                    // Divide o lote em duas linhas
                    const line1Text = batchWords.slice(0, mid).join(' ');
                    const line2Text = batchWords.slice(mid).join(' ');

                    // Formata tempo VTT (00:00:00.000) para ASS (0:00:00.00)
                    const startASS = currentCue.start.replace('.', ',');
                    const endASS = currentCue.end.replace('.', ',');

                    // Adiciona diálogos para as duas linhas com estilos diferentes
                    if (line1Text) events.push(`Dialogue: 0,${startASS},${endASS},Line1,,0,0,0,,${line1Text}`);
                    if (line2Text) events.push(`Dialogue: 0,${startASS},${endASS},Line2,,0,0,0,,${line2Text}`);
                }
                currentCue = null;
            }
        }
    }

    fs.writeFileSync(assPath, assHeader + events.join('\n'));
}

/**
 * Função CRÍTICA: Lê stream de dados (stdout/stderr) caractere por caractere
 * e quebra a linha tanto em '\n' quanto em '\r' (usado para barras de progresso).
 * Isso impede o congelamento do Whisper e FFmpeg.
 */
function listenToStreamProcess(stream, onLine) {
    let buffer = Buffer.alloc(0);
    stream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        let boundary = 0;
        
        // Procura por \n (newline) ou \r (carriage return)
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === 10 || buffer[i] === 13) { // '\n' is 10, '\r' is 13
                const line = buffer.slice(boundary, i).toString('utf8').trim();
                if (line) onLine(line);
                boundary = i + 1;
            }
        }
        // Mantém o restante no buffer
        buffer = buffer.slice(boundary);
    });
}

// ROTA PRINCIPAL: Processamento de Mídia e Áudio (SSE)
app.post('/api/process', upload.fields([{ name: 'media' }, { name: 'audio' }]), async (req, res) => {
    const processId = Date.now().toString();

    // Configura cabeçalhos para Server-Sent Events (SSE) - Realtime total
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendData = (payload) => {
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
    };

    // Log real no console do Render
    console.log(`[RENDER LOG] [START] Iniciando Processo ID: ${processId}`);

    try {
        if (!req.files || !req.files.media || !req.files.audio) {
            console.error(`[RENDER LOG] [ERROR] Arquivos faltantes para ID: ${processId}`);
            sendData({ error: 'Erro crítico: Arquivos de mídia e áudio são obrigatórios.' });
            return res.end();
        }

        const mediaFile = req.files.media[0];
        const audioFile = req.files.audio[0];
        const { styleModel, wordsPerBatch } = req.body;

        const outputDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputVideoPath = path.join(outputDir, `final_${processId}.mp4`);
        const isImage = mediaFile.mimetype.startsWith('image/');

        sendData({ processId, percent: 5, status: 'Analizando arquivos recebidos...', log: `[SYSTEM] Arquivos aceitos. ID: ${processId}` });

        // Obtém duração (necessário para FFmpeg e progresso real)
        let audioDuration = 0;
        try {
            audioDuration = await getAudioDuration(audioFile.path);
            console.log(`[RENDER LOG] [INFO] Duração Áudio: ${audioDuration}s para ID: ${processId}`);
        } catch (err) {
            console.error(`[RENDER LOG] [ERROR FFPROBE] ${err.message}`);
            sendData({ error: `Erro FFprobe (Metadados): ${err.message}`, log: `[ERROR] FFprobe falhou.` });
            throw err;
        }

        sendData({ percent: 15, status: 'Iniciando Transcrição Whisper AI...', log: `[SYSTEM] Áudio verificado (${audioDuration.toFixed(1)}s). Carregando modelo Whisper...` });

        const vttOutputDir = path.join(__dirname, 'uploads');
        // Spawn do Whisper CLI (tiny model para velocidade no Render free)
        const whisperProc = spawn('whisper', [
            audioFile.path,
            '--model', 'tiny',
            '--output_format', 'vtt',
            '--output_dir', vttOutputDir,
            '--verbose', 'False' // Evita spam excessivo de logs padrão
        ]);

        // Registra o processo para cancelamento
        activeProcesses.set(processId, { whisperProc, ffmpegProc: null, audioDuration });

        // Captura stderr (onde o Whisper joga o progresso real e logs)
        listenToStreamProcess(whisperProc.stderr, (log) => {
            console.log(`[RENDER LOG] [WHISPER STDERR] ${log}`);
            // Envia logs reais para o frontend
            sendData({ percent: 30, status: 'Whisper: Transcrevendo...', log: `[WHISPER] ${log}` });
        });

        // Captura stdout (logs gerais)
        listenToStreamProcess(whisperProc.stdout, (log) => {
            console.log(`[RENDER LOG] [WHISPER STDOUT] ${log}`);
            sendData({ percent: 40, status: 'Whisper: Processando...', log: `[WHISPER INFO] ${log}` });
        });

        whisperProc.on('error', (err) => {
            console.error(`[RENDER LOG] [ERROR WHISPER SPAWN] ${err.message}`);
            sendData({ error: `Erro na execução do Whisper: ${err.message}` });
        });

        // Callback de finalização do Whisper
        whisperProc.on('close', async (code) => {
            if (code !== 0) {
                console.error(`[RENDER LOG] [ERROR WHISPER] Código de saída: ${code}`);
                sendData({ error: `Whisper falhou (Código ${code}). Verifique logs do servidor.` });
                activeProcesses.delete(processId);
                return res.end();
            }

            console.log(`[RENDER LOG] [SUCCESS WHISPER] Transcrição concluída para ID: ${processId}`);
            sendData({ percent: 70, status: 'Transcrição concluída. Formatando legendas...', log: '[SYSTEM] Arquivo VTT gerado. Aplicando estilo ASS bicolor...' });

            const generatedVttPath = path.join(vttOutputDir, `${path.basename(audioFile.path)}.vtt`);
            const assPath = path.join(vttOutputDir, `${processId}.ass`);

            try {
                // Converte VTT para ASS com os 20 modelos
                convertVttToAssStyle(generatedVttPath, assPath, {
                    modelKey: styleModel,
                    wordsPerBatch: parseInt(wordsPerBatch) || 6
                });
            } catch (styleErr) {
                console.error(`[RENDER LOG] [ERROR ASS] ${styleErr.message}`);
                sendData({ error: `Erro na formatação das legendas: ${styleErr.message}` });
                activeProcesses.delete(processId);
                return res.end();
            }

            sendData({ percent: 80, status: 'Iniciando Renderização FFmpeg (Queima de Legendas)...', log: '[FFMPEG] Mesclando mídia, áudio e aplicando legendas hardcode...' });
            console.log(`[RENDER LOG] [START FFMPEG] Iniciando render para ID: ${processId}`);

            // Montagem do comando FFmpeg baseado no tipo de mídia (imagem vs vídeo)
            let ffmpegArgs = [];
            if (isImage) {
                // Modo Imagem Estática + Áudio
                ffmpegArgs = [
                    '-loop', '1', // Loop da imagem
                    '-i', mediaFile.path,
                    '-i', audioFile.path,
                    '-vf', `subtitles=${assPath}`, // Queima as legendas ASS
                    '-c:v', 'libx264', // Codec vídeo padrão
                    '-tune', 'stillimage', // Otimização para imagem estática
                    '-c:a', 'aac', // Codec áudio
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p', // Compatibilidade universal
                    '-t', audioDuration.toString(), // Limita duração ao áudio
                    '-shortest', // Garante parada no arquivo mais curto (segurança)
                    '-y', // Sobrescreve output
                    outputVideoPath
                ];
            } else {
                // Modo Vídeo + Áudio (Concatenação e Mixagem)
                ffmpegArgs = [
                    '-i', mediaFile.path,
                    '-i', audioFile.path,
                    // Filtro complexo: mescla vídeo(0:v) e áudio(1:a), depois aplica legendas no vídeo mesclado
                    '-filter_complex', `[0:v][1:a]concat=n=1:v=1:a=1[v][a];[v]subtitles=${assPath}[outv]`,
                    '-map', '[outv]', // Mapeia vídeo legendado
                    '-map', '[a]',    // Mapeia áudio mixado
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-y',
                    outputVideoPath
                ];
            }

            const ffmpegProc = spawn('ffmpeg', ffmpegArgs);
            // Atualiza referência do processo ativo para o FFmpeg
            const currentProc = activeProcesses.get(processId);
            if (currentProc) currentProc.ffmpegProc = ffmpegProc;

            // Escuta stderr do FFmpeg (onde ficam os logs de progresso 'time=...')
            listenToStreamProcess(ffmpegProc.stderr, (log) => {
                console.log(`[RENDER LOG] [FFMPEG STDERR] ${log}`);
                
                // Parser de progresso real do FFmpeg
                if (log.includes('time=')) {
                    // Extrai '00:00:00.00' do log '... time=00:00:10.50 ...'
                    const timeMatch = log.match(/time=(\d{2}:\d{2}:\d{2}.\d{2})/);
                    if (timeMatch && audioDuration > 0) {
                        const rawTime = timeMatch[1];
                        const parts = rawTime.split(':');
                        // Converte HH:MM:SS.ms para segundos totais
                        const seconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2].replace(',', '.'));
                        // Calcula porcentagem real da fase FFmpeg (mapeada de 80% a 99%)
                        const ffmpegPercent = Math.min(99, 80 + (seconds / audioDuration) * 19);
                        sendData({ percent: Math.round(ffmpegPercent), status: 'FFmpeg: Renderizando vídeo final...', log: `[FFMPEG] Processando tempo: ${rawTime}` });
                    }
                } else {
                    // Logs gerais do FFmpeg
                    sendData({ percent: 85, status: 'FFmpeg: Preparando render...', log: `[FFMPEG INFO] ${log.substring(0, 100)}` });
                }
            });

            ffmpegProc.on('error', (err) => {
                console.error(`[RENDER LOG] [ERROR FFMPEG SPAWN] ${err.message}`);
                sendData({ error: `Erro na execução do FFmpeg: ${err.message}` });
            });

            // Callback finalização FFmpeg
            ffmpegProc.on('close', (ffmpegCode) => {
                console.log(`[RENDER LOG] [FINISH FFMPEG] Código saída: ${ffmpegCode} para ID: ${processId}`);
                activeProcesses.delete(processId);

                if (ffmpegCode === 0) {
                    // SUCESSO ABSOLUTO
                    sendData({ percent: 100, complete: true, resultUrl: `/outputs/final_${processId}.mp4`, log: '[SUCESSO] Processo concluído reais! Vídeo pronto para download.' });
                    console.log(`[RENDER LOG] [COMPLETE SUCESSO] ID: ${processId}. Arquivo: final_${processId}.mp4`);
                } else {
                    // FALHA NO FFMPEG
                    sendData({ error: `FFmpeg falhou na renderização final (Código ${ffmpegCode}). Verifique logs do servidor.`, log: '[ERROR] FFmpeg falhou na compilação.' });
                }
                res.end(); // Encerra stream SSE
            });
        });

    } catch (err) {
        // Erro genérico capturado
        console.error(`[RENDER LOG] [CRITICAL ERROR CATCH] ${err.message}`);
        sendData({ error: `Erro interno crítico: ${err.message}`, log: '[ERROR] Falha crítica no catch.' });
        activeProcesses.delete(processId);
        res.end();
    }
});

// ROTA DE CANCELAMENTO (POST)
app.post('/api/cancel', (req, res) => {
    const { processId } = req.body;
    console.log(`[RENDER LOG] [CANCEL REQUEST] Recebido para ID: ${processId}`);
    
    if (activeProcesses.has(processId)) {
        const procGroup = activeProcesses.get(processId);
        
        // Mata processos usando SIGKILL para garantir parada imediata no Linux/Render
        if (procGroup.whisperProc) {
            console.log(`[RENDER LOG] [KILL] Matando Whisper para ID: ${processId}`);
            procGroup.whisperProc.kill('SIGKILL');
        }
        if (procGroup.ffmpegProc) {
            console.log(`[RENDER LOG] [KILL] Matando FFmpeg para ID: ${processId}`);
            procGroup.ffmpegProc.kill('SIGKILL');
        }
        
        activeProcesses.delete(processId);
        return res.json({ success: true, message: 'Processamento cancelado reais no servidor.' });
    }
    
    console.warn(`[RENDER LOG] [CANCEL WARN] Processo ${processId} não encontrado para cancelamento.`);
    res.status(404).json({ error: 'Processo não encontrado ou já finalizado.' });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`[RENDER LOG] [SYSTEM START] Servidor Profissional rodando reais na porta ${PORT}`);
    console.log(`[RENDER LOG] [INFO] Modo Docker/Render detectado. Caminhos temporários configurados.`);
});
