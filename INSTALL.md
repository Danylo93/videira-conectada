# 📦 Guia de Instalação - Videira Conectada

## 🚀 Instalação Rápida

### **Opção 1: Com Docker (Recomendado)**

```bash
# 1. Execute o setup automático
./scripts/wsl-setup.sh

# 2. Acesse a aplicação
# Frontend: http://localhost:3000
```

### **Opção 2: Sem Docker (Local)**

```bash
# 1. Execute o setup local
./scripts/simple-setup.sh

# 2. Acesse a aplicação
# Frontend: http://localhost:8080
```

## 🔧 Pré-requisitos

### **Para Docker:**
- Docker Desktop ou Rancher Desktop
- WSL2 (Windows) ou Linux

### **Para Local:**
- Node.js 18+
- NPM ou Yarn

## 📋 Instalação Detalhada

### **1. Instalar Node.js**

#### **Windows (WSL):**
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar terminal
source ~/.bashrc

# Instalar Node.js 18
nvm install 18
nvm use 18
```

#### **Windows (PowerShell):**
```powershell
# Instalar via Chocolatey
choco install nodejs

# Ou baixar do site oficial
# https://nodejs.org/
```

#### **Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### **2. Instalar Docker (Opcional)**

#### **Windows:**
1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Instale e reinicie o computador
3. Inicie o Docker Desktop

#### **WSL:**
```bash
# Instalar Docker no WSL
sudo apt-get update
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER
sudo service docker start
```

### **3. Configurar o Projeto**

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd videira-conectada

# 2. Instalar dependências
npm install
# ou
yarn install

# 3. Configurar variáveis de ambiente
cp env.docker.example .env

# 4. Iniciar o projeto
npm run dev
# ou
yarn dev
```

## 🐛 Solução de Problemas

### **Problema: Node.js não encontrado**

**Solução:**
```bash
# Verificar se Node.js está instalado
node --version

# Se não estiver, instalar
# Windows: Baixar do https://nodejs.org/
# Linux: sudo apt-get install nodejs npm
# WSL: nvm install 18
```

### **Problema: Docker não funciona**

**Solução:**
```bash
# Verificar se Docker está rodando
docker info

# Se não estiver, iniciar Docker Desktop
# Ou usar setup local: ./scripts/simple-setup.sh
```

### **Problema: Porta já em uso**

**Solução:**
```bash
# Verificar processos usando a porta
netstat -tulpn | grep :8080

# Parar processo ou usar outra porta
# Vite: npm run dev -- --port 3001
```

### **Problema: Permissões no WSL**

**Solução:**
```bash
# Dar permissão aos scripts
chmod +x scripts/*.sh

# Se necessário, executar como root
sudo ./scripts/simple-setup.sh
```

## 📊 Verificação da Instalação

### **Teste 1: Node.js**
```bash
node --version
# Deve retornar: v18.x.x
```

### **Teste 2: NPM/Yarn**
```bash
npm --version
# ou
yarn --version
```

### **Teste 3: Build**
```bash
npm run build
# Deve completar sem erros
```

### **Teste 4: Servidor**
```bash
npm run dev
# Deve iniciar em http://localhost:8080
```

## 🌐 Acessos

### **Desenvolvimento Local:**
- Frontend: http://localhost:8080
- Supabase: https://wkdfeizgfdkkkyatevpc.supabase.co

### **Docker:**
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050

## 📞 Suporte

Se você encontrar problemas:

1. **Verifique os logs:**
   ```bash
   npm run dev
   # ou
   docker-compose logs -f
   ```

2. **Consulte a documentação:**
   - [README.md](README.md)
   - [DOCKER.md](DOCKER.md)
   - [QUICKSTART.md](QUICKSTART.md)

3. **Abra uma issue** no repositório

4. **Entre em contato** com a equipe

## 🎯 Próximos Passos

Após a instalação:

1. **Configure o banco de dados** (se usando Docker)
2. **Teste as funcionalidades** principais
3. **Configure as variáveis** de ambiente
4. **Faça o deploy** para produção

---

**Dica**: Use `./scripts/simple-setup.sh` para uma instalação automática! 🚀
