import fs from 'fs/promises'
import path from 'path'

const LOG_DIR = path.resolve(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'price-simulator.log')

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true })
  } catch (err) {
    // ignore if exists
  }
}

export async function logPriceSimulatorEvent(entry: string) {
  const timestamp = new Date().toISOString()
  const payload = `${timestamp} | ${entry}\n`
  await ensureLogDir()
  await fs.appendFile(LOG_FILE, payload, 'utf-8')
}
