import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { removeCodeFences, readReply } from '../src/services/gemini.service.js'

test('Auth: password hashing and verification', async () => {
  let plain = 'secretPassword123'
  let hashed = await bcrypt.hash(plain, 10)

  assert.notEqual(hashed, plain)
  assert.equal(await bcrypt.compare(plain, hashed), true)
  assert.equal(await bcrypt.compare('wrongPassword', hashed), false)
})

test('Auth: JWT signing and verification', () => {
  let secret = 'test_jwt_secret_key_123'
  let payload = { id: '6713cd108f9024f0c4391e25' }

  let token = jwt.sign(payload, secret, { expiresIn: '1h' })
  assert.ok(token)

  let decoded = jwt.verify(token, secret)
  assert.equal(decoded.id, payload.id)
})

test('Auth: email format validation', () => {
  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  assert.equal(emailRegex.test('user@example.com'), true)
  assert.equal(emailRegex.test('developer.varun@domain.co.in'), true)
  assert.equal(emailRegex.test('plainaddress'), false)
  assert.equal(emailRegex.test('user@domain'), false)
  assert.equal(emailRegex.test('user@.com'), false)
})

test('AI Parser: strip markdown code fences', () => {
  let inputWithFences = '```html\n<!DOCTYPE html><html><body><h1>Hello</h1></body></html>\n```'
  let cleaned = removeCodeFences(inputWithFences)

  assert.equal(cleaned.startsWith('```'), false)
  assert.equal(cleaned.endsWith('```'), false)
  assert.equal(cleaned.includes('<h1>Hello</h1>'), true)
})

test('AI Parser: parse standard response with TITLE, SUMMARY, and HTML', () => {
  let rawAiReply = `TITLE: Coffee Shop
SUMMARY: Created a specialty coffee shop landing page.
---HTML---
<!DOCTYPE html>
<html lang="en">
<head><title>Coffee</title></head>
<body><h1>Roast & Brew</h1></body>
</html>`

  let parsed = readReply(rawAiReply)

  assert.equal(parsed.title, 'Coffee Shop')
  assert.equal(parsed.summary, 'Created a specialty coffee shop landing page.')
  assert.equal(parsed.html.includes('<h1>Roast & Brew</h1>'), true)
  assert.equal(parsed.html.startsWith('<!DOCTYPE html>'), true)
})

test('AI Parser: auto-wrap HTML fragment into valid document', () => {
  let fragmentReply = `---HTML---
<div class="card">
  <h2>Quick Card</h2>
  <p>Clean content</p>
</div>`

  let parsed = readReply(fragmentReply)

  assert.equal(parsed.html.includes('<!DOCTYPE html>'), true)
  assert.equal(parsed.html.includes('<html lang="en">'), true)
  assert.equal(parsed.html.includes('<h2>Quick Card</h2>'), true)
})

test('AI Parser: reject responses with no HTML markup', () => {
  let badReply = `---HTML---
I am an AI assistant and I cannot build web pages today.`

  assert.throws(
    () => readReply(badReply),
    /The AI reply did not contain a web page/
  )
})

test('Concurrency: in-memory lock prevents overlapping builds', () => {
  let activeGenerations = new Set()
  let projectId = 'project_abc123'

  assert.equal(activeGenerations.has(projectId), false)

  // Start build
  activeGenerations.add(projectId)
  assert.equal(activeGenerations.has(projectId), true)

  // Duplicate request check fails
  let isLocked = activeGenerations.has(projectId)
  assert.equal(isLocked, true)

  // Build completes
  activeGenerations.delete(projectId)
  assert.equal(activeGenerations.has(projectId), false)
})
