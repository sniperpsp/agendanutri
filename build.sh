#!/bin/bash

# Variáveis de configuração
ECR_REGISTRY="730335588602.dkr.ecr.us-east-1.amazonaws.com"
IMAGE_NAME="agendanutri"
REPOSITORY_NAME="bia-ecr"
IMAGE_TAG="latest"  # Você pode mudar para uma versão específica, como v1.0 ou a data atual, ex: $(date +%Y%m%d%H%M%S)
AWS_REGION="us-east-1"

# Função para exibir mensagens com timestamp
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Passo 1: Login no ECR
log_message "Iniciando login no Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
if [ $? -ne 0 ]; then
  log_message "Erro ao fazer login no ECR. Saindo..."
  exit 1
fi
log_message "Login no ECR bem-sucedido."

# Passo 2: Construir a imagem Docker
log_message "Iniciando a construção da imagem Docker..."
docker build -t $IMAGE_NAME .
if [ $? -ne 0 ]; then
  log_message "Erro ao construir a imagem Docker. Saindo..."
  exit 1
fi
log_message "Imagem Docker construída com sucesso."

# Passo 3: Marcar a imagem com a tag do ECR
log_message "Marcando a imagem com a tag $IMAGE_TAG..."
docker tag $IMAGE_NAME:latest $ECR_REGISTRY/$REPOSITORY_NAME:$IMAGE_TAG
if [ $? -ne 0 ]; then
  log_message "Erro ao marcar a imagem. Saindo..."
  exit 1
fi
log_message "Imagem marcada com sucesso."

# Passo 4: Enviar a imagem para o ECR
log_message "Enviando a imagem para o ECR..."
docker push $ECR_REGISTRY/$REPOSITORY_NAME:$IMAGE_TAG
if [ $? -ne 0 ]; then
  log_message "Erro ao enviar a imagem para o ECR. Saindo..."
  exit 1
fi
log_message "Imagem enviada para o ECR com sucesso."

# Passo 5: Mensagem final
log_message "Build e envio da imagem para o ECR concluídos com sucesso!"
