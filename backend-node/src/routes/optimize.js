/**
 * MoSAI Optimization Orchestrator & Audit Trail Router
 * Proxies deterministic physics calculation to Python microservice and records immutable audit logs.
 */

import express from 'express';
import crypto from 'crypto';
import { localStore } from '../db/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const PYTHON_URL = process.env.SCIENTIFIC_SERVICE_URL || 'http://localhost:8000';

// Main Packaging Optimization Pipeline
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { food_params, weights } = req.body;
    if (!food_params) {
      return res.status(400).json({ error: 'food_params is required.' });
    }

    // Include all registered database materials in the pool
    const registeredMaterials = localStore.getMaterials();

    // Call Python scientific microservice
    const pyResponse = await fetch(`${PYTHON_URL}/api/v1/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_params,
        weights: weights || { weight_barrier: 0.5, weight_cost: 0.35, weight_eco: 0.15 },
        custom_materials: registeredMaterials,
      }),
    });

    if (!pyResponse.ok) {
      const errText = await pyResponse.text();
      return res.status(pyResponse.status).json({
        error: `Scientific Microservice Error: ${errText}`,
      });
    }

    const optimizationResult = await pyResponse.json();

    // Generate unique SHA-256 verification hash
    const hashSeed = `${JSON.stringify(food_params)}-${Date.now()}-${Math.random()}`;
    const qr_hash = 'MOSAI-' + crypto.createHash('sha256').update(hashSeed).digest('hex').substring(0, 12).toUpperCase();

    // Identify top recommended compliant material
    const topMatch = optimizationResult.ranked_materials?.find((m) => m.is_compliant);
    const topMaterialId = topMatch ? topMatch.id : null;
    const overallStatus = topMatch ? 'Compliant' : 'Non-Compliant';

    // Persist immutable audit log entry
    const auditRecord = localStore.createAuditLog({
      user_id: req.user ? req.user.id : null,
      material_id: topMaterialId,
      food_params,
      compliance_status: overallStatus,
      review_status: req.body.review_status || 'In Review',
      review_notes: req.body.review_notes || '',
      qr_hash,
      full_payload: {
        ...optimizationResult,
        qr_hash,
        generated_at: new Date().toISOString(),
      },
    });

    res.json({
      ...optimizationResult,
      audit_id: auditRecord.id,
      qr_hash,
      review_status: auditRecord.review_status,
      review_notes: auditRecord.review_notes,
      verification_url: `/verify/${qr_hash}`,
      timestamp: auditRecord.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: `Optimization pipeline failure: ${err.message}` });
  }
});

// Audit History (User's past audits)
router.get('/history', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const logs = localStore.getAuditLogs(userId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch audit history: ${err.message}` });
  }
});

// Update Review Status and Notes on an Audit Log
router.patch('/history/:id/review', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { review_status, review_notes } = req.body;
    const updated = localStore.updateAuditLogReview(id, { review_status, review_notes });
    if (!updated) {
      return res.status(404).json({ error: 'Audit log not found.' });
    }
    res.json({ message: 'Review updated successfully.', log: updated });
  } catch (err) {
    res.status(500).json({ error: `Failed to update review: ${err.message}` });
  }
});

// Public QR Verification Inspection
router.get('/verify/:qrHash', (req, res) => {
  try {
    const { qrHash } = req.params;
    const log = localStore.getAuditLogByQrHash(qrHash.toUpperCase());
    if (!log) {
      return res.status(404).json({
        verified: false,
        error: 'No matching audit certificate found for this QR hash.',
      });
    }

    res.json({
      verified: true,
      audit_id: log.id,
      qr_hash: log.qr_hash,
      compliance_status: log.compliance_status,
      created_at: log.created_at,
      food_params: log.food_params,
      full_payload: log.full_payload,
    });
  } catch (err) {
    res.status(500).json({ error: `Verification lookup error: ${err.message}` });
  }
});

export default router;
