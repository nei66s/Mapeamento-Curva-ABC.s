# Integração provisória de manutenção

## Objetivo
Preparar o app para operar como um sistema paralelo de manutenção no varejo enquanto o PM corporativo (micro) ainda não existe. O foco é manter checklists, incidentes e ativos no próprio app, usando as classificações (“masseira A/B/C”, etc.) que serão trazidas posteriormente pelo PM.

## Fontes de dados internas

1. `/api/compliance` (ver `src/lib/compliance.server.ts`)  
   - Agenda visitas preventivas e armazena itens com `itemId`, `name`, `classification`, `status`.  
   - Fizemos normalização dos status (Português/inglês) para evitar divergências no front.  
2. `/api/incidents/pareto` (helpers em `src/lib/incidents.server.ts` + `docs/pareto.md`)  
   - Gera os 80% dos incidentes. Para cada linha retornada temos `itemName`, `count`, `pct`, `cumulativePct`.  
   - Serve para priorizar “masseiras” com maior número de chamados.  
3. `/api/tools` (helpers em `src/lib/tools.server.ts`)  
   - Cadastro simplificado de ativos: `category`, `status`, `lastMaintenance`, `assignedTo`.  
   - Pode ser consumido por dashboards operacionais mesmo sem o PM principal.

## Mapa de campos essenciais

| Entidade | Campos críticos | Comentário |
| --- | --- | --- |
| Checklist item | `itemId`, `name`, `classification`, `status` | `classification` aceita A/B/C ou rótulos de “masseira”; `status` normaliza para `completed/pending/not-applicable`. |
| Visita agendada | `storeId`, `storeName`, `visitDate`, `items[]` | Cada `item` carrega `itemId` e `status`; usamos `visitDate` para reconciliar atualizações. |
| Incidente | `itemName`, `classification`, `status`, `openedAt`, `description` | `itemName` pode conter a “masseira”; use a query Pareto para agrupar. |
| Ferramenta/ativo | `id`, `name`, `category`, `serialNumber`, `status`, `lastMaintenance` | `category` e `status` refletem o nível de criticidade/uso; `lastMaintenance` orienta alertas. |

### Exemplos de payloads

#### Agenda de visita (POST `/api/compliance`)
```json
{
  "storeId": "LOJA-001",
  "storeName": "Supermercado Central",
  "visitDate": "2025-11-20T09:00:00Z",
  "items": [
    { "itemId": "masseira-A-1", "status": "pending", "classification": "masseira A" },
    { "itemId": "masseira-B-2", "status": "pending", "classification": "masseira B" }
  ]
}
```

#### Atualização de status (PUT `/api/compliance`)
```json
{
  "storeId": "LOJA-001",
  "visitDate": "2025-11-20",
  "itemId": "masseira-A-1",
  "status": "completed"
}
```

#### Incidente (registro + Pareto)
```json
{
  "itemName": "masseira A - bomba",
  "classification": "masseira A",
  "openedAt": "2025-11-15T13:42:00Z",
  "status": "Aberto",
  "description": "Falha no motor principal após limpeza"
}
```
O endpoint `GET /api/incidents/pareto?group=title&top=7` consome incidentes com esse `itemName` e retorna a participação (% e acumulado).

#### Ferramenta / ativo (`POST` ou `PUT` `/api/tools`)
```json
{
  "id": "tool-masseira-a",
  "name": "Masseira A principal",
  "category": "Masseira",
  "serialNumber": "MA-001",
  "status": "Em Uso",
  "lastMaintenance": "2025-10-01T08:00:00Z"
}
```

## Dashboards e relatórios recomendados

1. **Curva ABC por classification**: agrupamento dos itens da compliance por `classification` (ex.: “masseira A, B e C”) com acumulado de tarefas/falhas para priorizar agendamento.  
2. **Pareto de incidentes**: use `/api/incidents/pareto` com `group=item` ou `group=title` para identificar quais “masseiras” geram mais chamados e estão impactando a operação.  
3. **Painel de ativos**: lista de ferramentas (`/api/tools`) com `status`, `assignedTo` e `lastMaintenance`; pode gerar alertas simples em front para quando `lastMaintenance` estiver perto da meta.  
4. **Checklist diário**: visão das visitas futuras com `visitDate`, `storeName` e quantidade de itens pendentes/complete; o recurso já existe no GET `/api/compliance`.

## Fluxo de integração com o futuro PM

1. O PM trará um identificador único (ex.: `masseira-A-1`) e classificação (`masseira A`). Guardamos esse metadata nos checklists/incidentes/ferramentas.  
2. Assim que o PM estiver pronto, podemos sincronizar esses identificadores (inserindo/atualizando `itemId` e `classification`); até lá, alimentamos manualmente via APIs internas.  
3. Quando houver integração ativa, crie jobs que:
   - atualizem `tools` com os ativos do PM;
   - importem checklists e visitas do PM para `/api/compliance`;
   - alimentem incidentes provenientes do PM com os mesmos `itemName/classification`.

## Próximos passos

1. Validar com o time quais classificações existem hoje no micro (nomes, combinações e o que significa “masseira”).  
2. Priorizar dashboards e alertas básicos usando os dados já disponíveis; por exemplo, alertas de visita com base na diferença entre `visitDate` e agora.  
3. Preparar scripts/sincronizadores automáticos assim que o PM estiver vivo: mapeie os campos do PM para os campos deste documento e defina a cadência (ex.: uma vez por dia).  

Se quiser, posso ajudar a transformar isso em tickets ou um documento de alinhamento para o time de manutenção. Quer um modelo em planilha ou board para isso?
