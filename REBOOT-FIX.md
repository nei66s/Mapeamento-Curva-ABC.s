# 🔴 PROBLEMA RESOLVIDO: App não iniciava após reboot

## Causa Raiz
O serviço `pm2-windows-service` rodava como **SYSTEM**, mas o PM2 precisa rodar como **seu usuário** para acessar:
- `C:\Users\neiol\.pm2\dump.pm2` (arquivo de processos salvos)
- Named pipes IPC (`//./pipe/rpc.sock`)

Erro observado: `EPERM //./pipe/rpc.sock`

---

## ✅ Solução Implementada

Substituímos `pm2-windows-service` por **NSSM** (Non-Sucking Service Manager):
- ✅ Roda PM2 sob **sua conta de usuário**
- ✅ Sem conflitos de permissão
- ✅ Auto-start no boot do Windows
- ✅ Logs dedicados e recuperação automática

---

## 🚀 SETUP RÁPIDO (5 minutos)

### Abra PowerShell ISE como Administrador
```
Botão direito no PowerShell ISE → "Executar como Administrador"
```

### Execute o script de instalação:
```powershell
cd C:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC
.\scripts\setup-nssm-pm2-service.ps1
```

### Você será solicitado:
1. **Senha do Windows** - necessária para o serviço rodar como você
2. Aguarde instalação (Chocolatey + NSSM se necessário)
3. Serviço `PM2-CurvaABC` será criado e iniciado

### Verifique:
```powershell
# 1. Serviço Windows
Get-Service PM2-CurvaABC

# 2. Processos PM2
pm2 status

# 3. Logs da aplicação
pm2 logs curva-abc --lines 50

# 4. Acesse no navegador
# http://localhost:9002
```

---

## 🔄 TESTE DE REBOOT (OBRIGATÓRIO)

```powershell
# Reinicie o computador
Restart-Computer

# Após reiniciar, execute:
pm2 status
pm2 logs curva-abc --lines 50
```

**Resultado esperado:**
- ✅ `curva-abc` aparece como `online`
- ✅ Logs mostram "Next.js ... Ready in XXXms"
- ✅ App acessível em http://localhost:9002

---

## 📁 Arquivos Criados/Modificados

1. **`scripts/setup-nssm-pm2-service.ps1`**
   - Script de instalação automatizada do serviço NSSM

2. **`scripts/pm2-resurrect.bat`** (criado automaticamente)
   - Executado pelo serviço NSSM no boot
   - Define `PM2_HOME=%USERPROFILE%\.pm2`
   - Roda `pm2 resurrect`

3. **`docs/NSSM-SERVICE-SETUP.md`**
   - Guia completo de uso e troubleshooting

4. **`logs/nssm/`** (criado no setup)
   - `pm2-service.log` - stdout do serviço
   - `pm2-service-error.log` - stderr do serviço

---

## 🛠️ Comandos Úteis

### Gerenciar Serviço
```powershell
# Status
Get-Service PM2-CurvaABC

# Iniciar/Parar
Start-Service PM2-CurvaABC
Stop-Service PM2-CurvaABC
Restart-Service PM2-CurvaABC

# Ver configuração (abre GUI)
nssm edit PM2-CurvaABC
```

### Gerenciar Processos PM2
```powershell
# Status
pm2 status

# Logs em tempo real
pm2 logs curva-abc

# Salvar estado atual (importante após mudanças)
pm2 save --force

# Reiniciar app
pm2 restart curva-abc

# Parar app
pm2 stop curva-abc

# Remover app
pm2 delete curva-abc
```

### Troubleshooting
```powershell
# Ver logs do serviço NSSM
Get-Content logs\nssm\pm2-service.log -Tail 50 -Wait
Get-Content logs\nssm\pm2-service-error.log -Tail 50

# Ver qual conta está rodando o serviço
Get-WmiObject win32_service | Where-Object {$_.Name -eq 'PM2-CurvaABC'} | Select Name, StartName, State

# Forçar PM2 a usar home correto
$env:PM2_HOME = "$env:USERPROFILE\.pm2"
pm2 status
```

---

## ⚠️ IMPORTANTE: Sempre rode `pm2 save` após mudanças

Sempre que você modificar processos PM2, salve o estado:
```powershell
pm2 save --force
```

Isso atualiza `C:\Users\neiol\.pm2\dump.pm2` que o serviço usa no boot.

---

## 📊 Status Atual

✅ Serviço `pm2-windows-service` desinstalado (causava EPERM)  
✅ Script NSSM pronto: `scripts/setup-nssm-pm2-service.ps1`  
✅ App rodando manualmente via `pm2 resurrect`  
⏳ **PRÓXIMO PASSO:** Execute o script NSSM e teste o reboot

---

## 🎯 Próximas Ações

1. **AGORA:** Execute `scripts/setup-nssm-pm2-service.ps1` como Admin
2. **DEPOIS:** Reinicie o computador (`Restart-Computer`)
3. **VERIFIQUE:** `pm2 status` após reboot deve mostrar `curva-abc` online
4. **OPCIONAL:** Configure reverse proxy (IIS/Caddy) para domínio de produção

---

## ✨ Benefícios da Solução NSSM

| Característica | pm2-windows-service (antigo) | NSSM (novo) |
|----------------|------------------------------|-------------|
| Permissões | ❌ Roda como SYSTEM | ✅ Roda como seu usuário |
| Acesso ao dump | ❌ EPERM errors | ✅ Acesso total |
| Manutenção | ❌ Deprecated | ✅ Mantido ativamente |
| GUI Config | ❌ Não | ✅ `nssm edit` |
| Recovery | ⚠️ Básico | ✅ Avançado |
| Logs | ⚠️ PM2 apenas | ✅ PM2 + NSSM logs |

---

## 📚 Documentação Relacionada

- `DEPLOY-PM2.md` - Deploy geral com PM2
- `docs/NSSM-SERVICE-SETUP.md` - Guia completo NSSM
- `docs/NSSM-INSTRUCTIONS.md` - Instruções manuais NSSM
- `ecosystem.config.js` - Configuração PM2 da aplicação

---

**Data:** 2025-11-21  
**Problema:** App não restaurava após reboot (EPERM)  
**Solução:** NSSM service rodando PM2 sob conta de usuário  
**Status:** ✅ Script pronto para execução
