/**
 * Microservice Proxy Router
 * Forwards RAG audit queries, PDF generation, and TDS file uploads directly to Python microservice.
 */

import express from 'express';
import multer from 'multer';

const router = express.Router();
const PYTHON_URL = process.env.SCIENTIFIC_SERVICE_URL || 'http://localhost:8000';

const upload = multer({ storage: multer.memoryStorage() });

// RAG Audit Query Proxy
router.post('/fssai-audit', async (req, res) => {
  try {
    const pyRes = await fetch(`${PYTHON_URL}/api/v1/rag/fssai-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await pyRes.json();
    res.status(pyRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: `RAG service communication failure: ${err.message}` });
  }
});

// FSSAI Knowledge Base Clauses Proxy
router.get('/rag/clauses', async (req, res) => {
  try {
    const pyRes = await fetch(`${PYTHON_URL}/api/v1/rag/clauses`);
    const data = await pyRes.json();
    res.status(pyRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch regulatory clauses: ${err.message}` });
  }
});

// Interactive Gemini RAG Assistant Q&A Proxy
router.post('/rag/ask', async (req, res) => {
  try {
    const pyRes = await fetch(`${PYTHON_URL}/api/v1/rag/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await pyRes.json();
    res.status(pyRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: `RAG AI Assistant failure: ${err.message}` });
  }
});

// PDF Certificate Report Proxy
router.post('/report/pdf', async (req, res) => {
  try {
    const pyRes = await fetch(`${PYTHON_URL}/api/v1/report/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!pyRes.ok) {
      const errText = await pyRes.text();
      return res.status(pyRes.status).json({ error: `PDF generator error: ${errText}` });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="MoSAI_FSSAI_Certificate.pdf"');
    
    const arrayBuffer = await pyRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: `PDF report generation failed: ${err.message}` });
  }
});

// TDS Document Upload Proxy
router.post('/tds/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const formData = new FormData();
    for (const file of req.files) {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('files', blob, file.originalname);
    }

    const pyRes = await fetch(`${PYTHON_URL}/api/v1/tds/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await pyRes.json();
    res.status(pyRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: `TDS upload failed: ${err.message}` });
  }
});

export default router;
