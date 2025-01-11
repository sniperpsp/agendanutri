# Usar imagem base do Node.js
FROM node:16

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos de dependências (package.json)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todos os arquivos da aplicação
COPY . .

# Expor a porta da aplicação
EXPOSE 80

# Comando para rodar a aplicação
CMD ["node", "server.js"]

