# 🚀 Quick Start - Videira Conectada

## ⚡ Início Rápido no WSL

### 🐳 **Opção 1: Com Docker (Recomendado)**

#### Setup Automático
```bash
# Execute o script de setup automático
./scripts/wsl-setup.sh
```

#### Setup Manual
```bash
# 1. Configure as variáveis de ambiente
cp env.docker.example .env

# 2. Inicie os containers
docker-compose -f docker-compose.dev.yml up --build

# 3. Acesse a aplicação
# Frontend: http://localhost:3000
```

### 🖥️ **Opção 2: Sem Docker (Local)**

Se você tiver problemas com Docker, use o setup local:

```bash
# Execute o setup local
./scripts/local-setup.sh
```

### 🔧 **Opção 3: Corrigir Docker**

Se o Docker não estiver funcionando:

```bash
# Execute o script de correção
./scripts/docker-fix.sh
```

## 🌐 Acessos Rápidos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **pgAdmin** | http://localhost:5050 | admin@videira.com / admin123 |
| **PostgreSQL** | localhost:5432 | videira_user / videira_password |

## 🛠️ Comandos Essenciais

```bash
# Iniciar desenvolvimento
./scripts/docker-setup.sh dev

# Ver logs
./scripts/docker-setup.sh logs

# Parar containers
./scripts/docker-setup.sh stop

# Limpar tudo
./scripts/docker-setup.sh clean
```

## 📋 Checklist de Verificação

- [ ] Docker Desktop instalado e rodando
- [ ] WSL2 configurado
- [ ] Arquivo `.env` criado
- [ ] Containers iniciados
- [ ] Frontend acessível em http://localhost:3000
- [ ] pgAdmin acessível em http://localhost:5050

## 🐛 Problemas Comuns

### Docker não inicia
```bash
# Verificar se Docker Desktop está rodando
docker info

# Reiniciar Docker Desktop
# Windows: Reiniciar Docker Desktop
# WSL: sudo service docker start
```

### Porta já em uso
```bash
# Verificar processos
netstat -tulpn | grep :3000

# Parar containers
docker-compose down
```

### Permissões no WSL
```bash
# Dar permissão aos scripts
chmod +x scripts/*.sh
```

## 📞 Suporte

- 📖 Documentação completa: [DOCKER.md](DOCKER.md)
- 🐛 Issues: Abra uma issue no repositório
- 💬 Chat: Entre em contato com a equipe

---

**Dica**: Use `./scripts/docker-setup.sh help` para ver todos os comandos! 🎯
