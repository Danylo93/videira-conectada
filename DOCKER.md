# 🐳 Docker Setup - Videira Conectada

Este guia explica como executar o projeto Videira Conectada usando Docker no WSL.

## 📋 Pré-requisitos

- WSL2 instalado e configurado
- Docker Desktop para Windows ou Docker Engine no WSL
- Docker Compose

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd videira-conectada
```

### 2. Configure as variáveis de ambiente
```bash
cp env.docker.example .env
# Edite o arquivo .env conforme necessário
```

### 3. Execute o script de setup
```bash
./scripts/docker-setup.sh dev
```

## 🛠️ Comandos Disponíveis

### Desenvolvimento
```bash
# Iniciar ambiente de desenvolvimento
./scripts/docker-setup.sh dev
# ou
docker-compose -f docker-compose.dev.yml up --build

# Ver logs
./scripts/docker-setup.sh logs
# ou
docker-compose -f docker-compose.dev.yml logs -f

# Parar containers
./scripts/docker-setup.sh stop
# ou
docker-compose -f docker-compose.dev.yml down
```

### Produção
```bash
# Iniciar ambiente de produção
./scripts/docker-setup.sh prod
# ou
docker-compose -f docker-compose.prod.yml up --build -d

# Parar containers
docker-compose -f docker-compose.prod.yml down
```

### Manutenção
```bash
# Ver status dos containers
./scripts/docker-setup.sh status

# Limpar volumes e containers
./scripts/docker-setup.sh clean

# Ver ajuda
./scripts/docker-setup.sh help
```

## 🌐 Acessos

### Desenvolvimento
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050
  - Email: admin@videira.com
  - Senha: admin123

### Produção
- **Frontend**: http://localhost:80
- **HTTPS**: https://localhost:443 (se configurado)

## 📊 Serviços Incluídos

### Frontend (React)
- **Porta**: 3000 (dev) / 80 (prod)
- **Hot Reload**: Habilitado em desenvolvimento
- **Build**: Otimizado para produção

### PostgreSQL
- **Porta**: 5432
- **Database**: videira_conectada
- **Usuário**: videira_user
- **Senha**: videira_password

### Redis
- **Porta**: 6379
- **Uso**: Cache e sessões

### pgAdmin (apenas desenvolvimento)
- **Porta**: 5050
- **Interface web** para gerenciar PostgreSQL

### Nginx (apenas produção)
- **Porta**: 80/443
- **Proxy reverso** e servidor web

## 🔧 Configuração

### Variáveis de Ambiente

Edite o arquivo `.env` para configurar:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Database
POSTGRES_PASSWORD=sua_senha_segura

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

### Volumes Persistentes

Os seguintes volumes são criados automaticamente:
- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `pgadmin_data`: Configurações do pgAdmin

## 🐛 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Verificar processos usando a porta
   netstat -tulpn | grep :3000
   
   # Parar containers
   docker-compose down
   ```

2. **Permissões no WSL**
   ```bash
   # Dar permissão de execução
   chmod +x scripts/docker-setup.sh
   ```

3. **Limpar cache do Docker**
   ```bash
   docker system prune -a
   docker volume prune
   ```

4. **Rebuild completo**
   ```bash
   docker-compose down -v
   docker-compose up --build --force-recreate
   ```

### Logs e Debug

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f frontend
docker-compose logs -f postgres

# Entrar no container
docker-compose exec frontend sh
docker-compose exec postgres psql -U videira_user -d videira_conectada
```

## 📁 Estrutura de Arquivos Docker

```
.
├── docker-compose.yml          # Configuração principal
├── docker-compose.dev.yml      # Desenvolvimento
├── docker-compose.prod.yml     # Produção
├── Dockerfile                  # Frontend (dev)
├── Dockerfile.prod             # Frontend (prod)
├── nginx.conf                  # Configuração Nginx
├── .dockerignore               # Arquivos ignorados
├── env.docker.example          # Exemplo de variáveis
└── scripts/
    └── docker-setup.sh         # Script de setup
```

## 🔒 Segurança

### Desenvolvimento
- Senhas padrão para facilitar desenvolvimento
- Portas expostas para debug
- pgAdmin acessível

### Produção
- Use senhas fortes
- Configure SSL/TLS
- Restrinja acesso às portas
- Use secrets do Docker

## 📈 Performance

### Otimizações Incluídas
- Multi-stage build para produção
- Cache de dependências Node.js
- Compressão gzip no Nginx
- Volumes otimizados

### Monitoramento
```bash
# Ver uso de recursos
docker stats

# Ver informações dos containers
docker-compose ps
```

## 🤝 Contribuição

Para contribuir com melhorias no Docker:

1. Teste as mudanças localmente
2. Documente novas funcionalidades
3. Atualize este README
4. Crie PR com as mudanças

---

**Dica**: Use `./scripts/docker-setup.sh help` para ver todos os comandos disponíveis! 🚀
