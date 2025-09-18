#!/bin/bash

# Script simples para executar o projeto

set -e

echo "🍇 Videira Conectada - Setup Simples"
echo "===================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "📖 Por favor, instale Node.js 18+ primeiro:"
    echo "   https://nodejs.org/"
    echo "   ou use: nvm install 18"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION encontrado"

# Verificar se npm/yarn está disponível
if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo "✅ Yarn encontrado"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo "✅ NPM encontrado"
else
    echo "❌ Nenhum gerenciador de pacotes encontrado"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
$PACKAGE_MANAGER install

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << 'EOF'
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
if $PACKAGE_MANAGER run build; then
    echo "✅ Build funcionando!"
else
    echo "❌ Erro no build. Verifique as dependências."
    exit 1
fi

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "🚀 Para iniciar o servidor de desenvolvimento:"
echo "   $PACKAGE_MANAGER run dev"
echo ""
echo "🌐 Acesse: http://localhost:8080"
echo ""
echo "⏹️  Pressione Ctrl+C para parar o servidor"
echo ""

# Perguntar se quer iniciar
read -p "🚀 Deseja iniciar o servidor agora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Iniciando servidor..."
    $PACKAGE_MANAGER run dev
fi
