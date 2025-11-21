# Explicação dos Workflows de Relatórios Semanais

## 📋 Resumo dos 3 Workflows

### 1. `weekly-reports-status-workflow.json`
**Tipo**: Webhook (consulta manual)  
**Quando usar**: 
- ✅ Para consultar status via API/webhook
- ✅ Para integração com outros sistemas
- ✅ Para testes manuais
- ❌ **NÃO envia WhatsApp automaticamente**

**Uso**: Acesse a URL do webhook para obter o status atual

---

### 2. `weekly-reports-whatsapp-workflow.json`
**Tipo**: Agendado (uma vez por semana)  
**Quando usar**:
- ✅ Se quiser enviar apenas uma vez por semana (segunda às 18h)
- ✅ Se não precisa de verificação contínua
- ❌ **NÃO verifica a cada 15 minutos**
- ❌ **NÃO adapta-se automaticamente**

**Uso**: Envia mensagens uma vez por semana para todos os pendentes

---

### 3. `weekly-reports-whatsapp-scheduled-workflow.json` ⭐ **RECOMENDADO**
**Tipo**: Agendado (verificação contínua)  
**Quando usar**:
- ✅ **Este é o workflow principal que você precisa**
- ✅ Verifica a cada 15 minutos
- ✅ Envia apenas para pendentes
- ✅ Para quando todos preencherem
- ✅ Adapta-se automaticamente

**Uso**: Roda continuamente, verificando e enviando mensagens conforme necessário

---

## 🎯 Qual Workflow Usar?

### Cenário 1: Automação Completa (Recomendado)
**Use apenas**: `weekly-reports-whatsapp-scheduled-workflow.json`

Este workflow faz tudo:
- Verifica a cada 15 minutos
- Envia mensagens para pendentes
- Para quando todos preencherem
- Funciona 24/7

**Não precisa dos outros 2 workflows neste caso.**

---

### Cenário 2: Envio Único Semanal
**Use apenas**: `weekly-reports-whatsapp-workflow.json`

Se você só quer enviar uma vez por semana (segunda às 18h) e não precisa de verificação contínua.

**Não precisa dos outros 2 workflows neste caso.**

---

### Cenário 3: Consulta Manual + Automação
**Use**:
- `weekly-reports-status-workflow.json` (para consultas manuais)
- `weekly-reports-whatsapp-scheduled-workflow.json` (para automação)

Útil se você quer:
- Consultar status via webhook quando precisar
- Ter automação rodando em paralelo

---

## 💡 Recomendação Final

**Para a maioria dos casos, use apenas:**
```
weekly-reports-whatsapp-scheduled-workflow.json
```

Este workflow faz tudo que você precisa:
- ✅ Verifica continuamente
- ✅ Envia mensagens automaticamente
- ✅ Para quando todos preencherem
- ✅ Funciona sem intervenção

Os outros 2 workflows são opcionais e podem ser ignorados se você não precisar de funcionalidades específicas deles.

---

## 🗑️ Posso Deletar os Outros?

**Sim!** Se você vai usar apenas o workflow de verificação contínua, pode deletar ou ignorar os outros 2 workflows. Eles não são necessários para a funcionalidade principal.

**Mantenha apenas se:**
- Quiser consultar status via webhook manualmente (workflow 1)
- Preferir envio único semanal ao invés de contínuo (workflow 2)

