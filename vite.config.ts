import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'
import https from 'https'
import http from 'http'

export default defineConfig({
  build: {
    // Enable aggressive code splitting to reduce initial chunk size
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy', async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          // Read request body
          const buffers: Buffer[] = []
          for await (const chunk of req) {
            buffers.push(chunk as Buffer)
          }
          const body = JSON.parse(Buffer.concat(buffers).toString())
          const { targetUrl, extraHeaders, payload } = body

          if (!targetUrl || !payload) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing targetUrl or payload' }))
            return
          }

          const urlObj = new URL(targetUrl)
          const isHttps = urlObj.protocol === 'https:'
          const postData = JSON.stringify(payload)
          // Use provided headers, or fallback to Bearer token (backward compat)
          const reqHeaders = extraHeaders || { 'Authorization': `Bearer ${body.apiKey}` }

          const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...reqHeaders,
              'Content-Length': Buffer.byteLength(postData),
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
              'Accept': 'text/event-stream, application/json',
            },
          }

          const proxyReq = (isHttps ? https : http).request(options, (proxyRes) => {
            res.statusCode = proxyRes.statusCode || 500
            const skipHeaders = ['transfer-encoding', 'connection', 'keep-alive']
            for (const [key, value] of Object.entries(proxyRes.headers)) {
              if (!skipHeaders.includes(key.toLowerCase()) && value) {
                res.setHeader(key, Array.isArray(value) ? value.join(', ') : value)
              }
            }
            if (proxyRes.headers['content-type']?.toString().includes('text/event-stream')) {
              res.setHeader('Content-Type', 'text/event-stream')
              res.setHeader('Cache-Control', 'no-cache')
              res.setHeader('Connection', 'keep-alive')
            }
            proxyRes.on('data', (chunk: Buffer) => res.write(chunk))
            proxyRes.on('end', () => res.end())
          })

          proxyReq.on('error', (err: Error) => {
            const errMsg = err.message || String(err) || 'Unknown error'
            console.error('[api-proxy] Error:', errMsg, 'target:', urlObj.hostname)
            if (!res.writableEnded) {
              res.statusCode = 502
              res.end(JSON.stringify({ error: `Proxy request failed: ${errMsg}`, target: urlObj.hostname }))
            }
          })

          proxyReq.setTimeout(15000, () => {
            proxyReq.destroy()
            if (!res.writableEnded) {
              res.statusCode = 504
              res.end(JSON.stringify({ error: 'Proxy timeout (15s)' }))
            }
          })

          proxyReq.write(postData)
          proxyReq.end()
        })
      },
    },
  ],
})
