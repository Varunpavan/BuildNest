import { GoogleGenAI } from '@google/genai'

// System prompt and output rules for web page generation
let SYSTEM_INSTRUCTION = `You are NxtBuild, an expert web designer and front-end developer.
You build complete, good looking, working web pages from a short description.

OUTPUT FORMAT (follow it exactly):
TITLE: a short project name, 2 to 4 words
SUMMARY: one friendly sentence telling the user what you built or changed
---HTML---
<!DOCTYPE html>
...the full page...

CODE RULES:
- Return ONE complete HTML file. Put all CSS inside a <style> tag and all JavaScript inside a <script> tag.
- Do not wrap the answer in markdown code fences. Do not add any text after the closing </html>.
- The page runs inside a sandboxed iframe. Do NOT use localStorage, sessionStorage or cookies. Keep any data in plain JavaScript variables.
- Do not use external JavaScript libraries or frameworks. Google Fonts through a <link> tag is allowed.
- Do not use image URLs. Make visuals with CSS gradients, inline SVG, shapes and emoji instead.
- Make the page fully responsive and make interactive parts (forms, buttons, tabs, calculators) actually work.
- Use semantic HTML, readable class names and a few short comments.

DESIGN RULES:
- Choose a clear visual direction that fits the subject: a specific colour palette, one or two characterful fonts, generous spacing.
- Write real, specific copy for the subject. Never use lorem ipsum.
- Avoid generic purple gradients, identical rows of rounded cards and stock template layouts.
- Keep strong contrast so text is easy to read.

WHEN CHANGING AN EXISTING PAGE:
- You will receive the current page code. Apply only the change that was asked and keep everything else the same.
- Still return the full updated page, not just the changed part.`

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in the server .env file')
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
}

export function removeCodeFences(text) {
  return text
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}

export function readReply(rawText) {
  let marker = '---HTML---'
  let markerIndex = rawText.indexOf(marker)

  let header = ''
  let html = rawText

  if (markerIndex !== -1) {
    header = rawText.slice(0, markerIndex)
    html = rawText.slice(markerIndex + marker.length)
  }

  html = removeCodeFences(html.trim())

  let doctypeIndex = html.toLowerCase().indexOf('<!doctype')
  if (doctypeIndex > 0) {
    html = html.slice(doctypeIndex)
  }

  // trim conversational chat after closing </html> tag
  let closingIndex = html.toLowerCase().lastIndexOf('</html>')
  if (closingIndex !== -1) {
    html = html.slice(0, closingIndex + 7)
  }

  // auto-wrap if model returned an HTML fragment without a full document
  if (!html.toLowerCase().includes('<html')) {
    let lower = html.toLowerCase()
    let isFragment = lower.includes('<div') || lower.includes('<section') || lower.includes('<header') || lower.includes('<main') || lower.includes('<body')
    if (isFragment) {
      html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Generated Page</title>\n</head>\n<body>\n${html}\n</body>\n</html>`
    } else {
      throw new Error('The AI reply did not contain a web page')
    }
  }

  let titleMatch = header.match(/TITLE:\s*(.+)/i)
  let summaryMatch = header.match(/SUMMARY:\s*(.+)/i)

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    summary: summaryMatch ? summaryMatch[1].trim() : 'Done! Your page is ready. Tell me what to change.',
    html,
  }
}

export async function generatePage({ prompt, currentCode, history }) {
  let ai = getClient()

  let userMessage = ''

  if (currentCode) {
    userMessage += `This is the current page:\n\n${currentCode}\n\n`

    if (history.length > 0) {
      let chatText = history
        .map((message) => `${message.role === 'user' ? 'User' : 'You'}: ${message.text}`)
        .join('\n')
      userMessage += `Recent conversation:\n${chatText}\n\n`
    }

    userMessage += `Change request: ${prompt}`
  } else {
    userMessage = `Build this page: ${prompt}`
  }

  let response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.9,
      maxOutputTokens: 30000,
    },
  })

  return readReply(response.text || '')
}
