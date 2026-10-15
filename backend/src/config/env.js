import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
const backendRoot = fileURLToPath(new URL('../../', import.meta.url));

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

function parseCorsOrigins(value) {
  const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('CORS_ORIGINS must contain one or more explicit HTTP(S) origins; wildcards are not supported.');
  }

  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGINS contains an invalid origin: ${origin}`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error(`CORS_ORIGINS entries must be plain HTTP(S) origins without paths: ${origin}`);
    }
  }
  return origins;
}

function parseSessionTtl(value) {
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
    throw new Error('SESSION_TTL_HOURS must be an integer between 1 and 168.');
  }
  return hours * 60 * 60 * 1000;
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

const host = process.env.HOST || '127.0.0.1';
if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1' && host !== '0.0.0.0' && host !== '::') {
  throw new Error('HOST must be a hostname or IP address.');
}

export const config = Object.freeze({
  nodeEnv,
  host,
  port: parsePort(process.env.PORT || '3000'),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'),
  sessionTtlMs: parseSessionTtl(process.env.SESSION_TTL_HOURS || '8'),
  dataDir: path.resolve(backendRoot, process.env.DATA_DIR || 'data'),
});
