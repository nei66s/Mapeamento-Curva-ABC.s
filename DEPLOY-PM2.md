# Deploy rápido com PM2 (Windows)

Passos para rodar a aplicação Next.js em produção usando PM2 no Windows.

1) Build (na raiz do repo):

```powershell
npm run build
```

2) Iniciar via PM2 (usando o `ecosystem.config.js` gerado):

```powershell
# iniciar (ou reiniciar) usando o arquivo de ecosystem
pm2 start ecosystem.config.js
# verificar status
pm2 status curva-abc
# ver logs
pm2 logs curva-abc --lines 200
```

3) Salvar o estado atual para restaurar os processos após reinício do PM2:

```powershell
pm2 save
```

4) Habilitar auto-start no boot (nota sobre Windows):

- Em sistemas Linux, `pm2 startup` cria o script de inicialização automaticamente.
- No Windows o suporte depende do ambiente; em algumas instalações `pm2 startup` pode falhar com `Init system not found`.

Opções no Windows:
- Usar o pacote `pm2-windows-service` (recomendado para Windows Server):

```powershell
# instalar serviço (requer privilégios de administrador)
npm i -g pm2-windows-service
pm2-service-install -n PM2
# depois salve a lista
pm2 save
```

- Ou criar um serviço do Windows via `nssm` ou `sc.exe` que execute `pm2 resurrect`/`pm2 start` no boot.

5) Notas úteis:
- O projeto já inclui `ecosystem.config.js` que inicia o Next.js com `node_modules/next/dist/bin/next start -p 9002`.
- Expor em 80/443: coloque um reverse-proxy (IIS/nginx) apontando para a porta 9002.
- Para debug remoto/healthchecks: consulte `/api/health` e `/api/health/db` endpoints.

6) Comandos de manutenção:

```powershell
# reiniciar
pm2 restart curva-abc
# parar
pm2 stop curva-abc
# remover
pm2 delete curva-abc
# aplicar mudanças no ecosystem
pm2 reload ecosystem.config.js
```

Se quiser, eu posso gerar um script PowerShell que instala `pm2-windows-service` e cria o serviço automaticamente (requer executar o PowerShell como Administrador).
