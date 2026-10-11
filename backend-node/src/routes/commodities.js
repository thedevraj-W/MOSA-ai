/**
 * Commodities Preset Database Routes
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CSV_PATH = path.resolve(__dirname, '../../../data/commodities.csv');

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return res.status(404).json({ error: 'Commodities preset dataset not found on disk.' });
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 6) {
        records.push({
          commodity_name: parts[0],
          moisture_limit: parseFloat(parts[1]),
          fat_content: parseFloat(parts[2]),
          ph: parseFloat(parts[3]),
          ro2: parseFloat(parts[4]),
          shelf_days: parseInt(parts[5], 10),
        });
      }
    }

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: `Failed to load commodities: ${err.message}` });
  }
});

export default router;
