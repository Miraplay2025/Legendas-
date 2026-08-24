FROM node:18-bullseye-slim

# Instalação de dependências do sistema, fontes e FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    git \
    curl \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Atualiza a cache de fontes para o FFmpeg reconhecer os estilos
RUN fc-cache -f -v

# Instalação do OpenAI Whisper via pip
RUN pip3 install --no-cache-dir openai-whisper

WORKDIR /app

# Copia e instala dependências do Node.js
COPY package*.json ./
RUN npm install

# Copia o código-fonte do projeto
COPY . .

# Criação dos diretórios temporários para uploads e outputs
RUN mkdir -p uploads outputs

EXPOSE 3000

CMD ["npm", "start"]
