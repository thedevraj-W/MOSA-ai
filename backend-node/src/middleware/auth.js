/**
 * JWT Authentication Middleware
 */

import jwt from 'jsonwebtoken';
import { localStore } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mosai-secret-key-2026-sih-packaging';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = localStore.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists.' });
    }
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token is invalid or expired.' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = localStore.findUserById(decoded.userId);
    if (user) {
      req.user = { id: user.id, email: user.email, name: user.name };
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
