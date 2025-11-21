#!/usr/bin/env node
// Simple test script to POST an example payload to the local price-simulator endpoint.
// Usage: node scripts/price-simulator-test.js

const DEFAULT_URL = process.env.PRICE_SIMULATOR_URL || 'http://localhost:9002/api/price-simulator'

const example = {
  tipo: 'equipamento',
  descricao: 'Teste automático - manutenção de motor',
  quantidade: 1,
  area_m2: 0,
  complexidade: 'media',
  cidade: 'Localhost, XX',
  equipamentoMarca: 'TesteCo',
  equipamentoModelo: 'T-1',
  horasUso: 100
}

async function run() {
  try {
    console.log('POST', DEFAULT_URL)
    const res = await fetch(DEFAULT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(example),
    })

    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const j = await res.json()
      console.log('Resposta JSON:', JSON.stringify(j, null, 2))
    } else {
      const txt = await res.text()
      console.log('Resposta não-JSON:', txt.slice(0, 1000))
    }
  } catch (err) {
    console.error('Erro durante requisição:', err)
    process.exitCode = 2
  }
}

// Node 18+ has global fetch. If older Node is used, print helpful hint.
if (typeof fetch !== 'function') {
  console.error('Este script espera Node 18+ com fetch global. Use curl ou atualize o Node.')
  process.exit(1)
}

run()
