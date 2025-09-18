#!/bin/bash

# Script de setup rápido para WSL - Videira Conectada

set -e

echo "🍇 Configurando Videira Conectada no WSL..."

# Verificar se estamos no WSL
if ! grep -q Microsoft /proc/version; then
    echo "⚠️  Este script é otimizado para WSL. Continuando mesmo assim..."
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Iniciando Docker..."
    
    # Tentar iniciar Docker Desktop (Windows)
    if command -v "C:\Program Files\Docker\Docker\Docker Desktop.exe" &> /dev/null; then
        echo "🚀 Iniciando Docker Desktop..."
        "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" &
        echo "⏳ Aguardando Docker inicializar..."
        sleep 30
    else
        echo "❌ Docker Desktop não encontrado. Por favor, instale o Docker Desktop."
        exit 1
    fi
fi

# Verificar se Docker está funcionando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ainda não está funcionando. Verifique a instalação."
    exit 1
fi

echo "✅ Docker está funcionando!"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.docker.example .env
    echo "✅ Arquivo .env criado com configurações padrão."
fi

# Verificar se o arquivo .env tem as configurações necessárias
if ! grep -q "VITE_SUPABASE_URL" .env; then
    echo "⚠️  Configurando variáveis de ambiente..."
    cat >> .env << EOF

# Configurações adicionais
VITE_SUPABASE_URL=https://wkdfeizgfdkkkyatevpc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZGZlaXpnZmRra2t5YXRldnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDIwNDAsImV4cCI6MjA3MzI3ODA0MH0.RQZS8sWrcoipiO_v7vIyn4XP1rTenoj6EeT_YLK7T-M
EOF
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Limpar volumes antigos (opcional)
read -p "🧹 Deseja limpar volumes antigos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Limpando volumes antigos..."
    docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    docker system prune -f
fi

# Construir e iniciar containers
echo "🚀 Construindo e iniciando containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status
echo "📊 Status dos containers:"
docker-compose -f docker-compose.dev.yml ps

# Verificar se os serviços estão funcionando
echo "🔍 Verificando serviços..."

# Verificar PostgreSQL
if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U videira_user -d videira_conectada > /dev/null 2>&1; then
    echo "✅ PostgreSQL está funcionando"
else
    echo "⚠️  PostgreSQL ainda está inicializando..."
fi

# Verificar Redis
if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis está funcionando"
else
    echo "⚠️  Redis ainda está inicializando..."
fi

# Mostrar informações de acesso
echo ""
echo "🎉 Setup concluído! Acesse os serviços em:"
echo ""
echo "🌐 Frontend:     http://localhost:3000"
echo "🗄️  PostgreSQL:   localhost:5432"
echo "📊 pgAdmin:      http://localhost:5050"
echo "🔴 Redis:        localhost:6379"
echo ""
echo "📋 Credenciais:"
echo "   PostgreSQL:"
echo "     Database: videira_conectada"
echo "     Usuário:  videira_user"
echo "     Senha:    videira_password"
echo ""
echo "   pgAdmin:"
echo "     Email:    admin@videira.com"
echo "     Senha:    admin123"
echo ""
echo "🛠️  Comandos úteis:"
echo "   Ver logs:     ./scripts/docker-setup.sh logs"
echo "   Parar:        ./scripts/docker-setup.sh stop"
echo "   Status:       ./scripts/docker-setup.sh status"
echo "   Limpar:       ./scripts/docker-setup.sh clean"
echo ""
echo "📖 Para mais informações, consulte DOCKER.md"
echo ""

# Perguntar se quer ver logs
read -p "📋 Deseja ver os logs em tempo real? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Mostrando logs (Ctrl+C para sair)..."
    docker-compose -f docker-compose.dev.yml logs -f
fi
