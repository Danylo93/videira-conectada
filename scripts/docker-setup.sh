#!/bin/bash

# Script para configurar e executar o projeto Videira Conectada com Docker

set -e

echo "🍇 Configurando Videira Conectada com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.docker.example .env
    echo "✅ Arquivo .env criado. Ajuste as variáveis conforme necessário."
fi

# Função para desenvolvimento
dev() {
    echo "🚀 Iniciando ambiente de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml up --build
}

# Função para produção
prod() {
    echo "🚀 Iniciando ambiente de produção..."
    docker-compose -f docker-compose.prod.yml up --build -d
}

# Função para parar containers
stop() {
    echo "🛑 Parando containers..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.prod.yml down
}

# Função para limpar volumes
clean() {
    echo "🧹 Limpando volumes e containers..."
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
}

# Função para logs
logs() {
    echo "📋 Mostrando logs..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# Função para status
status() {
    echo "📊 Status dos containers..."
    docker-compose -f docker-compose.dev.yml ps
}

# Menu principal
case "${1:-dev}" in
    "dev")
        dev
        ;;
    "prod")
        prod
        ;;
    "stop")
        stop
        ;;
    "clean")
        clean
        ;;
    "logs")
        logs
        ;;
    "status")
        status
        ;;
    "help"|"-h"|"--help")
        echo "🍇 Videira Conectada - Docker Setup"
        echo ""
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  dev     - Inicia ambiente de desenvolvimento (padrão)"
        echo "  prod    - Inicia ambiente de produção"
        echo "  stop    - Para todos os containers"
        echo "  clean   - Para containers e remove volumes"
        echo "  logs    - Mostra logs dos containers"
        echo "  status  - Mostra status dos containers"
        echo "  help    - Mostra esta ajuda"
        echo ""
        echo "Exemplos:"
        echo "  $0 dev      # Inicia desenvolvimento"
        echo "  $0 prod     # Inicia produção"
        echo "  $0 stop     # Para containers"
        ;;
    *)
        echo "❌ Comando inválido: $1"
        echo "Use '$0 help' para ver os comandos disponíveis."
        exit 1
        ;;
esac
