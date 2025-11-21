# Simulador de Preços

Breve documentação de uso do endpoint de simulação de preços e instruções rápidas para testes locais.

Endpoint
--

- URL: `POST /api/price-simulator`
- Content-Type: `application/json`

Payloads de exemplo
--

1) Simulação para equipamento

```json
{
  "tipo": "equipamento",
  "descricao": "Manutenção preventiva do motor",
  "quantidade": 1,
  "area_m2": 0,
  "complexidade": "media",
  "cidade": "São Paulo, SP",
  "equipamentoMarca": "Caterpillar",
  "equipamentoModelo": "X2000",
  "horasUso": 1200
}
```

2) Simulação para civil / obras

```json
{
  "tipo": "civil",
  "descricao": "Reforma do piso em área comercial",
  "quantidade": 1,
  "area_m2": 120,
  "complexidade": "alta",
  "cidade": "Rio de Janeiro, RJ",
  "materialQualidade": "alta",
  "precisaAlvara": true,
  "estimativaEquipeHoras": 80
}
```

3) Simulação para manutenção genérica

```json
{
  "tipo": "manutencao",
  "descricao": "Troca de peças e calibração",
  "quantidade": 2,
  "area_m2": 0,
  "complexidade": "media",
  "cidade": "Belo Horizonte, MG"
}
```

Como testar localmente
--

1) Usando `curl` (macOS / WSL / PowerShell com curl instalado):

```bash
curl -X POST http://localhost:9002/api/price-simulator \
  -H "Content-Type: application/json" \
  -d '{"tipo":"manutencao","descricao":"Teste","quantidade":1,"area_m2":0,"complexidade":"media","cidade":"Test"}'
```

2) Usando PowerShell (Invoke-RestMethod):

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:9002/api/price-simulator -ContentType 'application/json' -Body (@{ tipo='manutencao'; descricao='Teste'; quantidade=1; area_m2=0; complexidade='media'; cidade='Test' } | ConvertTo-Json)
```

3) Script Node rápido (veja `scripts/price-simulator-test.js` no repositório):

    - `node scripts/price-simulator-test.js` (assume servidor dev rodando em `http://localhost:9002`)

Sobre integração com IA
--

O simulador usa uma heurística por padrão. Se credenciais para GenAI / Google AI estiverem configuradas, uma chamada opcional para a IA pode ser feita.

Variáveis de ambiente relevantes (dev):

- `GEMINI_API_KEY` — chave de API para modelos Gemini (opcional)
- `GOOGLE_API_KEY` ou `GOOGLE_GENAI_API_KEY` — alternativas que o projeto verifica
- `GOOGLE_APPLICATION_CREDENTIALS` — caminho para arquivo JSON de service-account (opcional)

Se nenhuma credencial estiver presente a aplicação usa apenas heurística local e retorna um objeto `{ ok: true, result: { estimate, currency, breakdown, details? } }`.

Diagnóstico rápido
--

- Se `curl` retorna HTML (página de erro) em vez de JSON, verifique se o servidor Next está rodando (`npm run dev`).
- Em dev, a porta padrão usada pelo projeto é `9002`.

Contatos
--

Abra uma issue ou fale comigo para incluir exemplos adicionais ou transformar o script de teste em um conjunto de testes automatizados.
