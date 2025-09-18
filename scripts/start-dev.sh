#!/bin/bash

# Script para iniciar o projeto em modo de desenvolvimento

set -e

echo "🍇 Iniciando Videira Conectada em modo de desenvolvimento..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "📖 Por favor, instale Node.js 18+ primeiro:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não está instalado!"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"
echo "✅ NPM $(npm --version) encontrado"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

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
if npm run build; then
    echo "✅ Build funcionando!"
else
    echo "❌ Erro no build. Verifique as dependências."
    exit 1
fi

echo ""
echo "🎉 Tudo configurado! Iniciando servidor de desenvolvimento..."
echo "🌐 Acesse: http://localhost:8080"
echo "⏹️  Pressione Ctrl+C para parar"
echo ""

# Iniciar servidor de desenvolvimento
npm run dev
