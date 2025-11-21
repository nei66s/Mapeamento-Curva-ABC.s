module.exports = {
  apps: [
    {
      name: 'curva-abc',
      // Run the Next.js JS entry with node directly so PM2 executes it as JS
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 9002',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
