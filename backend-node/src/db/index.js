/**
 * MoSAI Dual-Mode Database Engine
 * Seamlessly connects to PostgreSQL/pgvector if DATABASE_URL is configured,
 * otherwise runs a persistent zero-config local storage with full seed data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const LOCAL_DB_PATH = path.resolve(__dirname, '../../local_db.json');

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = Boolean(DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://')));

let pgPool = null;

if (isPostgres) {
  try {
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    console.log('[MoSAI DB] Connected to PostgreSQL instance.');
  } catch (err) {
    console.error('[MoSAI DB Warning] Could not connect to PostgreSQL, falling back to local store:', err.message);
  }
}

// Local persistent store structure
class LocalStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      users: [],
      materials: [],
      audit_logs: [],
    };
    this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('[MoSAI LocalStore] Resetting corrupted local DB:', err.message);
      }
    } else {
      this.save();
    }
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Users
  findUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.data.users.find((u) => u.id === Number(id));
  }

  createUser({ email, password_hash, name }) {
    const id = this.data.users.length > 0 ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1;
    const user = {
      id,
      email,
      password_hash,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Materials
  getMaterials() {
    return this.data.materials;
  }

  getMaterialById(id) {
    return this.data.materials.find((m) => m.id === Number(id));
  }

  addMaterial(mat) {
    const id = this.data.materials.length > 0 ? Math.max(...this.data.materials.map((m) => m.id)) + 1 : 1;
    const newMat = {
      id,
      name: mat.name || mat.material || 'Custom Material',
      grade: mat.grade || 'Industrial Standard',
      wvtr: Number(mat.wvtr),
      otr: Number(mat.otr),
      thickness: Number(mat.thickness || mat.thickness_um || 50),
      cost_per_sqm: Number(mat.cost_per_sqm || mat.cost_inr_per_kg || 150),
      eco_score: Number(mat.eco_score || 70),
      category: mat.category || 'Flexible Barrier Film',
      acid_resistant: Boolean(mat.acid_resistant ?? true),
      fat_safe: Boolean(mat.fat_safe ?? true),
      breathable: Boolean(mat.breathable ?? false),
      biodegradable: Boolean(mat.biodegradable ?? false),
      created_at: new Date().toISOString(),
    };
    this.data.materials.push(newMat);
    this.save();
    return newMat;
  }

  // Audit Logs
  createAuditLog({ user_id, material_id, food_params, compliance_status, qr_hash, full_payload, review_status, review_notes }) {
    const id = this.data.audit_logs.length > 0 ? Math.max(...this.data.audit_logs.map((a) => a.id)) + 1 : 1;
    const log = {
      id,
      user_id: user_id ? Number(user_id) : null,
      material_id: material_id ? Number(material_id) : null,
      food_params,
      compliance_status,
      review_status: review_status || 'In Review',
      review_notes: review_notes || '',
      qr_hash,
      full_payload: full_payload || {},
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.push(log);
    this.save();
    return log;
  }

  updateAuditLogReview(id, { review_status, review_notes }) {
    const log = this.data.audit_logs.find((a) => a.id === Number(id));
    if (!log) return null;
    if (review_status !== undefined) log.review_status = review_status;
    if (review_notes !== undefined) log.review_notes = review_notes;
    this.save();
    return log;
  }

  getAuditLogs(userId = null) {
    if (userId) {
      return this.data.audit_logs.filter((l) => l.user_id === Number(userId));
    }
    return this.data.audit_logs;
  }

  getAuditLogByQrHash(qrHash) {
    return this.data.audit_logs.find((l) => l.qr_hash === qrHash);
  }
}

export const localStore = new LocalStore(LOCAL_DB_PATH);

// Initialize Tables and Seeds
export async function initializeDatabase() {
  if (pgPool) {
    console.log('[MoSAI DB] Initializing PostgreSQL schemas...');
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS materials (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          grade VARCHAR(100),
          wvtr REAL NOT NULL,
          otr REAL NOT NULL,
          thickness REAL NOT NULL,
          cost_per_sqm REAL,
          eco_score REAL,
          category VARCHAR(100),
          acid_resistant BOOLEAN DEFAULT TRUE,
          fat_safe BOOLEAN DEFAULT TRUE,
          breathable BOOLEAN DEFAULT FALSE,
          biodegradable BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          material_id INTEGER REFERENCES materials(id),
          food_params JSONB NOT NULL,
          compliance_status VARCHAR(50) NOT NULL,
          qr_hash VARCHAR(64) UNIQUE NOT NULL,
          full_payload JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[MoSAI DB] PostgreSQL tables verified.');
    } catch (err) {
      console.error('[MoSAI DB Error] PostgreSQL table initialization failed:', err.message);
    }
  }

  // Seed default benchmark materials if empty
  seedBenchmarkMaterials();
}

function seedBenchmarkMaterials() {
  const currentMaterials = localStore.getMaterials();
  if (currentMaterials.length > 0) return;

  const defaultSeed = [
    { name: "LDPE (Low-Density Polyethylene)", grade: "Extrusion Grade 22FA002", thickness: 70, wvtr: 11.0, otr: 2700.0, acid_resistant: true, fat_safe: false, breathable: false, biodegradable: false, cost_per_sqm: 125.0, eco_score: 65, category: "Polyolefin Film" },
    { name: "HDPE (High-Density Polyethylene)", grade: "Blow Molding Grade 52GB003", thickness: 60, wvtr: 3.8, otr: 2000.0, acid_resistant: true, fat_safe: true, breathable: false, biodegradable: false, cost_per_sqm: 132.0, eco_score: 75, category: "Rigid Polyolefin" },
    { name: "PET / LLDPE Laminate", grade: "Dry Bonded Dual Layer", thickness: 50, wvtr: 1.2, otr: 75.0, acid_resistant: true, fat_safe: true, breathable: false, biodegradable: false, cost_per_sqm: 155.0, eco_score: 70, category: "Barrier Laminate" },
    { name: "PET / VMPET / LLDPE (Metalized)", grade: "Vacuum Metalized Barrier", thickness: 45, wvtr: 0.8, otr: 1.5, acid_resistant: false, fat_safe: true, breathable: false, biodegradable: false, cost_per_sqm: 195.0, eco_score: 45, category: "High Barrier Metalized" },
    { name: "PET / ALU / LLDPE (Aluminum Foil Laminate)", grade: "Triplex Retort Grade", thickness: 90, wvtr: 0.005, otr: 0.005, acid_resistant: true, fat_safe: true, breathable: false, biodegradable: false, cost_per_sqm: 340.0, eco_score: 30, category: "Hermetic High Barrier" },
    { name: "Biodegradable Film (PLA / PBAT)", grade: "EN 13432 Compostable", thickness: 35, wvtr: 180.0, otr: 950.0, acid_resistant: false, fat_safe: false, breathable: true, biodegradable: true, cost_per_sqm: 280.0, eco_score: 95, category: "Bio-based Compostable" },
    { name: "Micro-Perforated LDPE / PP", grade: "Laser Perforated MAP Film", thickness: 30, wvtr: 14.0, otr: 12000.0, acid_resistant: true, fat_safe: false, breathable: true, biodegradable: false, cost_per_sqm: 150.0, eco_score: 60, category: "Perforated MAP Produce" },
  ];

  for (const m of defaultSeed) {
    localStore.addMaterial(m);
  }
  console.log(`[MoSAI DB] Seeded ${defaultSeed.length} benchmark materials.`);
}
