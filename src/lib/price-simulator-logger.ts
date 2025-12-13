export async function logPriceSimulatorEvent(entry: string) {
  const timestamp = new Date().toISOString()
  // eslint-disable-next-line no-console
  console.info(`[price-simulator] ${timestamp} | ${entry}`)
}
