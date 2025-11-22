# Explicação dos Workflows de Relatórios Semanais

## 📋 Resumo dos Workflows Disponíveis

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

### 3. `weekly-reports-whatsapp-scheduled-workflow.json` (Automático)
**Tipo**: Agendado (verificação contínua)  
**Quando usar**:
- ✅ Verifica a cada 15 minutos automaticamente
- ✅ Envia apenas para pendentes
- ✅ Para quando todos preencherem
- ✅ Adapta-se automaticamente
- ⚠️ Pode enviar mensagens mesmo quando não necessário

**Uso**: Roda continuamente, verificando e enviando mensagens conforme necessário

---

### 4. `weekly-reports-whatsapp-manual-workflow.json` ⭐ **RECOMENDADO PARA CONTROLE**
**Tipo**: Webhook (acionamento manual)  
**Quando usar**:
- ✅ **Controle total sobre quando enviar**
- ✅ Acionado pelo pastor via botão na interface
- ✅ Envia apenas para líderes pendentes no momento
- ✅ Feedback imediato
- ✅ Não envia spam

**Uso**: Pastor clica no botão "Enviar WhatsApp" e o sistema envia apenas para quem está pendente

---

## 🎯 Qual Workflow Usar?

### Cenário 1: Controle Manual (Recomendado) ⭐
**Use apenas**: `weekly-reports-whatsapp-manual-workflow.json`

Este workflow oferece:
- Controle total sobre quando enviar
- Envia apenas quando o pastor solicita
- Feedback imediato
- Não envia mensagens desnecessárias

**Como usar**: Pastor clica no botão "Enviar WhatsApp" na interface quando quiser enviar lembretes.

---

### Cenário 2: Automação Completa
**Use apenas**: `weekly-reports-whatsapp-scheduled-workflow.json`

Este workflow faz tudo automaticamente:
- Verifica a cada 15 minutos
- Envia mensagens para pendentes
- Para quando todos preencherem
- Funciona 24/7

**Ideal para**: Quando você quer que o sistema funcione sem intervenção manual.

---

### Cenário 3: Envio Único Semanal
**Use apenas**: `weekly-reports-whatsapp-workflow.json`

Se você só quer enviar uma vez por semana (segunda às 18h) e não precisa de verificação contínua.

**Não precisa dos outros 2 workflows neste caso.**

---

### Cenário 4: Consulta Manual + Automação
**Use**:
- `weekly-reports-status-workflow.json` (para consultas manuais)
- `weekly-reports-whatsapp-scheduled-workflow.json` (para automação)

Útil se você quer:
- Consultar status via webhook quando precisar
- Ter automação rodando em paralelo

---

## 💡 Recomendação Final

**Para a maioria dos casos, use:**
```
weekly-reports-whatsapp-manual-workflow.json
```

Este workflow oferece:
- ✅ Controle total sobre quando enviar
- ✅ Envia apenas quando necessário
- ✅ Feedback imediato
- ✅ Não envia spam

**Alternativa (automação completa):**
```
weekly-reports-whatsapp-scheduled-workflow.json
```

Use se preferir automação contínua sem intervenção manual.

**Você também pode usar ambos simultaneamente** se quiser ter automação + opção manual!

---

## 🗑️ Posso Deletar os Outros?

**Sim!** Se você vai usar apenas o workflow de verificação contínua, pode deletar ou ignorar os outros 2 workflows. Eles não são necessários para a funcionalidade principal.

**Mantenha apenas se:**
- Quiser consultar status via webhook manualmente (workflow 1)
- Preferir envio único semanal ao invés de contínuo (workflow 2)

