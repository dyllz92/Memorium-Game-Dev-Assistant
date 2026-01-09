import { createServer } from 'http';
import { parse } from 'url';

const PORT = 3001;

async function loadHandlers() {
  // Dynamic imports to avoid loading issues
  const generate = (await import('./api/generate.ts')).default;
  const openaiGenerate = (await import('./api/openai-generate.ts')).default;
  return { generate, openaiGenerate };
}

const handlers = await loadHandlers();

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = parse(req.url, true);
  const pathname = url.pathname;

  if (pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const response = await handlers.generate(
          new Request('http://localhost:3001/api/generate', {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' },
          })
        );
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(await response.text());
      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  if (pathname === '/api/openai-generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const response = await handlers.openaiGenerate(
          new Request('http://localhost:3001/api/openai-generate', {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' },
          })
        );
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(await response.text());
      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
