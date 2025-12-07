import { test, expect } from '@playwright/test'
import fs from 'fs'

test('forgot password -> reset password flow', async ({ page, baseURL }) => {
  const email = 'e2e-user@example.com'

  // Open forgot password page
  await page.goto('/forgot-password')
  await page.fill('input[type="email"]', email)
  await page.click('button[type="submit"]')

  // wait briefly for server to write token file
  await page.waitForTimeout(500)

  // read token from tmp file
  const raw = fs.readFileSync('tmp/reset-tokens.json', 'utf8')
  const tokens = JSON.parse(raw || '{}')
  const entry = tokens[email]
  test.expect(entry, 'token entry should exist for email').toBeTruthy()
  const token = entry.token

  // Go to reset link
  await page.goto(`/reset-password?token=${token}`)
  await page.fill('input[type="password"]', 'NewPassword123')
  // second password input
  await page.fill('input[type="password"]', 'NewPassword123')
  await page.click('button[type="submit"]')

  // expect a success message or redirect to login
  await page.waitForTimeout(800)
  const content = await page.content()
  test.expect(content.includes('Senha redefinida com sucesso') || page.url().includes('/login')).toBeTruthy()
})
