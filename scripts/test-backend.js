const http = require('http')

const data = JSON.stringify({ queueId: 'default', meta: { source: 'direct-backend-test' } })

const opts = new URL('http://localhost:3001/tickets')

const req = http.request(opts, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
  let body = ''
  res.setEncoding('utf8')
  res.on('data', d => body += d)
  res.on('end', () => {
    console.log('status', res.statusCode)
    try { console.log('body', JSON.parse(body)) } catch(e) { console.log('body', body) }
  })
})

req.on('error', err => { console.error('error', err.message); process.exit(1) })
req.write(data)
req.end()
