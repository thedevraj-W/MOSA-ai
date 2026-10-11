/**
 * MoSAI Orchestration Gateway Server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/index.js';

import authRouter from './routes/auth.js';
import materialsRouter from './routes/materials.js';
import commoditiesRouter from './routes/commodities.js';
import optimizeRouter from './routes/optimize.js';
import proxyRouter from './routes/proxy.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MoSAI Node.js Orchestration Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/commodities', commoditiesRouter);
app.use('/api/optimize', optimizeRouter);
app.use('/api', proxyRouter);

// Start Server
async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`[MoSAI Gateway] Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[MoSAI Gateway Fatal Error]', err);
  process.exit(1);
});
