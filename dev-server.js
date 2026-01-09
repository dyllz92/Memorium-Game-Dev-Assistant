import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Import API handlers
import generateHandler from './api/generate.ts';
import openaiGenerateHandler from './api/openai-generate.ts';

const app = await createServer({
  plugins: [react()],
  server: {
    middlewareMode: true,
  },
});

// Custom Express-like server
import express from 'express';
const expressApp = express();

// Parse JSON
expressApp.use(express.json());

// API Routes
expressApp.post('/api/generate', async (req, res) => {
  try {
    const response = await generateHandler(new Request('http://localhost:5173/api/generate', {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    }));
    res.status(response.status).json(await response.json());
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'API error' });
  }
});

expressApp.post('/api/openai-generate', async (req, res) => {
  try {
    const response = await openaiGenerateHandler(new Request('http://localhost:5173/api/openai-generate', {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    }));
    res.status(response.status).json(await response.json());
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'API error' });
  }
});

// Vite middleware
expressApp.use(app.middlewares);

// SPA fallback
expressApp.use('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  app.transformIndexHtml(req.url, readFileSync(resolve('index.html'), 'utf-8'))
    .then(html => res.end(html))
    .catch(err => next(err));
});

expressApp.listen(5173, () => {
  console.log('Dev server running on http://localhost:5173');
});
