#!/bin/bash

# Script para corrigir problemas de Docker no WSL

set -e

echo "🔧 Diagnóstico e correção do Docker..."

# Função para verificar se Docker está funcionando
check_docker() {
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker está funcionando!"
        return 0
    else
        echo "❌ Docker não está funcionando"
        return 1
    fi
}

# Função para tentar iniciar Docker Desktop
start_docker_desktop() {
    echo "🚀 Tentando iniciar Docker Desktop..."
    
    # Caminhos possíveis do Docker Desktop
    local paths=(
        "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe"
        "/mnt/c/Program Files (x86)/Docker/Docker/Docker Desktop.exe"
        "/mnt/c/Users/$USER/AppData/Local/Docker/Docker Desktop.exe"
    )
    
    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "📁 Encontrado Docker Desktop em: $path"
            echo "🚀 Iniciando Docker Desktop..."
            "$path" &
            echo "⏳ Aguardando Docker Desktop inicializar..."
            sleep 30
            return 0
        fi
    done
    
    echo "❌ Docker Desktop não encontrado"
    return 1
}

# Função para tentar iniciar Rancher Desktop
start_rancher_desktop() {
    echo "🚀 Tentando iniciar Rancher Desktop..."
    
    local paths=(
        "/mnt/c/Users/$USER/AppData/Local/rancher-desktop/Rancher Desktop.exe"
        "/mnt/c/Program Files/Rancher Desktop/Rancher Desktop.exe"
    )
    
    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "📁 Encontrado Rancher Desktop em: $path"
            echo "🚀 Iniciando Rancher Desktop..."
            "$path" &
            echo "⏳ Aguardando Rancher Desktop inicializar..."
            sleep 30
            return 0
        fi
    done
    
    echo "❌ Rancher Desktop não encontrado"
    return 1
}

# Função para configurar Docker context
configure_docker_context() {
    echo "🔧 Configurando contexto do Docker..."
    
    # Tentar diferentes contextos
    local contexts=("default" "rancher-desktop" "desktop-linux")
    
    for context in "${contexts[@]}"; do
        echo "🔄 Tentando contexto: $context"
        if docker context use "$context" 2>/dev/null; then
            if check_docker; then
                echo "✅ Contexto $context funcionando!"
                return 0
            fi
        fi
    done
    
    return 1
}

# Função para instalar Docker no WSL
install_docker_wsl() {
    echo "📦 Instalando Docker diretamente no WSL..."
    
    # Atualizar pacotes
    sudo apt-get update
    
    # Instalar dependências
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Adicionar chave GPG do Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Adicionar repositório
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    
    # Iniciar serviço
    sudo service docker start
    
    echo "✅ Docker instalado no WSL!"
}

# Função principal
main() {
    echo "🍇 Videira Conectada - Docker Fix"
    echo "=================================="
    
    # Verificar se Docker já está funcionando
    if check_docker; then
        echo "🎉 Docker já está funcionando! Nada a fazer."
        return 0
    fi
    
    echo "🔍 Diagnosticando problema..."
    
    # Verificar se estamos no WSL
    if grep -q Microsoft /proc/version; then
        echo "🐧 Detectado WSL"
        
        # Tentar configurar contexto
        if configure_docker_context; then
            echo "✅ Docker configurado via contexto!"
            return 0
        fi
        
        # Tentar iniciar Docker Desktop
        if start_docker_desktop; then
            if check_docker; then
                echo "✅ Docker Desktop iniciado com sucesso!"
                return 0
            fi
        fi
        
        # Tentar iniciar Rancher Desktop
        if start_rancher_desktop; then
            if check_docker; then
                echo "✅ Rancher Desktop iniciado com sucesso!"
                return 0
            fi
        fi
        
        # Perguntar se quer instalar Docker no WSL
        echo ""
        echo "🤔 Nenhum Docker Desktop encontrado ou funcionando."
        read -p "Deseja instalar Docker diretamente no WSL? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker_wsl
            echo "⚠️  Você precisa fazer logout e login novamente para usar Docker sem sudo"
            echo "   Ou execute: newgrp docker"
        fi
    else
        echo "🐧 Sistema Linux detectado"
        install_docker_wsl
    fi
    
    # Verificação final
    if check_docker; then
        echo "🎉 Docker está funcionando!"
        echo "🚀 Agora você pode executar: ./scripts/docker-setup.sh dev"
    else
        echo "❌ Não foi possível configurar Docker automaticamente"
        echo "📖 Consulte a documentação: DOCKER.md"
        echo "💬 Entre em contato para suporte"
    fi
}

# Executar função principal
main "$@"
