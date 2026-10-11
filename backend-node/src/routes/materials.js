/**
 * Materials Routes
 */

import express from 'express';
import { localStore } from '../db/index.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// List all candidate packaging materials
router.get('/', (req, res) => {
  try {
    const materials = localStore.getMaterials();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch materials: ${err.message}` });
  }
});

// Add a custom / vendor packaging material
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      name,
      material,
      grade,
      wvtr,
      otr,
      thickness,
      thickness_um,
      cost_per_sqm,
      cost_inr_per_kg,
      eco_score,
      category,
      acid_resistant,
      fat_safe,
      breathable,
      biodegradable,
    } = req.body;

    const matName = name || material;
    if (!matName || wvtr === undefined || otr === undefined) {
      return res.status(400).json({ error: 'Name, WVTR, and OTR are mandatory fields.' });
    }

    const created = localStore.addMaterial({
      name: matName,
      grade: grade || 'Custom Vendor Specification',
      wvtr: Number(wvtr),
      otr: Number(otr),
      thickness: Number(thickness || thickness_um || 50),
      cost_per_sqm: Number(cost_per_sqm || cost_inr_per_kg || 150),
      eco_score: Number(eco_score || 70),
      category: category || 'Custom Substrate',
      acid_resistant: acid_resistant !== undefined ? Boolean(acid_resistant) : true,
      fat_safe: fat_safe !== undefined ? Boolean(fat_safe) : true,
      breathable: Boolean(breathable),
      biodegradable: Boolean(biodegradable),
    });

    res.status(201).json({
      message: 'Custom material registered successfully.',
      material: created,
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to create material: ${err.message}` });
  }
});

export default router;
