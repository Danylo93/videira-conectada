#!/bin/bash

# Script para executar o projeto localmente sem Docker

set -e

echo "🍇 Configurando Videira Conectada localmente (sem Docker)..."

# Carregar NVM se existir
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instalando..."
    
    # Instalar Node.js via nvm
    if ! command -v nvm &> /dev/null; then
        echo "📦 Instalando NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Instalar Node.js 18
    nvm install 18
    nvm use 18
    
    # Recarregar o ambiente
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION instalado"

# Verificar se npm/yarn está disponível
if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
else
    echo "❌ Nenhum gerenciador de pacotes encontrado"
    exit 1
fi

echo "✅ Usando $PACKAGE_MANAGER"

# Instalar dependências
echo "📦 Instalando dependências..."
$PACKAGE_MANAGER install

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://wkdfeizgfdkkkyatevpc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZGZlaXpnZmRra2t5YXRldnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDIwNDAsImV4cCI6MjA3MzI3ODA0MH0.RQZS8sWrcoipiO_v7vIyn4XP1rTenoj6EeT_YLK7T-M

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_OFFLINE_MODE=false

# Development
NODE_ENV=development
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
EOF
    echo "✅ Arquivo .env criado"
fi

# Verificar se o build funciona
echo "🔨 Testando build..."
$PACKAGE_MANAGER run build

echo "✅ Build funcionando!"

# Perguntar se quer iniciar o servidor
echo ""
echo "🎉 Setup local concluído!"
echo ""
echo "🌐 Para iniciar o servidor de desenvolvimento:"
echo "   $PACKAGE_MANAGER run dev"
echo ""
echo "🌐 Para build de produção:"
echo "   $PACKAGE_MANAGER run build"
echo ""
echo "🌐 Para preview da produção:"
echo "   $PACKAGE_MANAGER run preview"
echo ""

read -p "🚀 Deseja iniciar o servidor de desenvolvimento agora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Iniciando servidor de desenvolvimento..."
    echo "🌐 Acesse: http://localhost:8080"
    echo "⏹️  Pressione Ctrl+C para parar"
    echo ""
    $PACKAGE_MANAGER run dev
fi
