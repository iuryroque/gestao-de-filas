export default async function handler(req, res) {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001'

  const forward = async (method, path, body, query) => {
    const qs = query && Object.keys(query).length
      ? '?' + new URLSearchParams(query).toString()
      : ''
    const url = `${BACKEND}${path}${qs}`
    const opts = { method, headers: {} }
    if (body) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
    const r = await fetch(url, opts)
    const text = await r.text()
    let json
    try { json = JSON.parse(text) } catch { json = text }
    return { status: r.status, body: json }
  }

  try {
    if (req.method === 'POST') {
      const result = await forward('POST', '/tickets', req.body)
      return res.status(result.status).json(result.body)
    }

    if (req.method === 'GET') {
      const result = await forward('GET', '/tickets', null, req.query)
      return res.status(result.status).json(result.body)
    }

    res.setHeader('Allow', 'GET,POST')
    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', detail: err.message })
  }
}
