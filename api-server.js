#!/usr/bin/env node
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Set OPENAI_API_KEY from environment
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('Warning: OPENAI_API_KEY is not set');
}

// Import and use API handlers
try {
  const { default: generateHandler } = await import('./api/generate.ts');
  const { default: openaiGenerateHandler } = await import('./api/openai-generate.ts');
  
  app.post('/api/generate', async (req, res) => {
    try {
      const response = await generateHandler(
        new Request('http://localhost:3001/api/generate', {
          method: 'POST',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Error in /api/generate:', error);
      res.status(500).json({ error: error.message || 'API error' });
    }
  });

  app.post('/api/openai-generate', async (req, res) => {
    try {
      const response = await openaiGenerateHandler(
        new Request('http://localhost:3001/api/openai-generate', {
          method: 'POST',
          body: JSON.stringify(req.body),
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Error in /api/openai-generate:', error);
      res.status(500).json({ error: error.message || 'API error' });
    }
  });

  app.listen(3001, () => {
    console.log('API server running on http://localhost:3001');
  });
} catch (error) {
  console.error('Failed to load API handlers:', error);
  process.exit(1);
}
