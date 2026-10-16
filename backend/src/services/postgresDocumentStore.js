import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;
const pool = new Pool(config.databaseConfig);
let schemaPromise;

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL connection error:', error.message);
});

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS lynn_documents (
        document_key text PRIMARY KEY,
        document_value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `).catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

async function loadInitialValue(key, validate, initialValue) {
  let contents;
  try {
    contents = await readFile(path.join(config.dataDir, key), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      validate(initialValue);
      return initialValue;
    }
    throw error;
  }

  let value;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error(`${key} contains invalid JSON; refusing to import it into PostgreSQL.`);
  }
  validate(value);
  return value;
}

async function withDocument(key, validate, initialValue, operation) {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let result = await client.query(
      'SELECT document_value FROM lynn_documents WHERE document_key = $1 FOR UPDATE',
      [key],
    );
    if (result.rowCount === 0) {
      const initial = await loadInitialValue(key, validate, initialValue);
      await client.query(
        'INSERT INTO lynn_documents (document_key, document_value) VALUES ($1, $2::jsonb) ON CONFLICT (document_key) DO NOTHING',
        [key, JSON.stringify(initial)],
      );
      result = await client.query(
        'SELECT document_value FROM lynn_documents WHERE document_key = $1 FOR UPDATE',
        [key],
      );
    }
    const currentValue = result.rows[0].document_value;
    validate(currentValue);
    const change = await operation(currentValue);
    if (change.changed) {
      validate(change.records);
      await client.query(
        'UPDATE lynn_documents SET document_value = $2::jsonb, updated_at = now() WHERE document_key = $1',
        [key, JSON.stringify(change.records)],
      );
    }
    await client.query('COMMIT');
    return change.value;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function withPostgresArray(key, validate, operation, initialRecords = []) {
  return withDocument(key, validate, initialRecords, operation);
}

export async function withPostgresValue(key, validate, initialValue, operation) {
  return withDocument(key, validate, initialValue, operation);
}

export async function closeDocumentStore() {
  await pool.end();
}
