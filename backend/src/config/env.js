import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
const backendRoot = fileURLToPath(new URL('../../', import.meta.url));

function parsePort(value, name = 'PORT') {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
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

const databaseUrl = process.env.DATABASE_URL?.trim() || '';
if (nodeEnv !== 'test' && databaseUrl) {
  let parsedDatabaseUrl;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// scheme.');
  }
  if (!parsedDatabaseUrl.username || !parsedDatabaseUrl.password) {
    throw new Error('DATABASE_URL must include a PostgreSQL username and password.');
  }
}
const databaseConfig = nodeEnv === 'test'
  ? {}
  : databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: process.env.PGHOST || '127.0.0.1',
        port: parsePort(process.env.PGPORT || '5432', 'PGPORT'),
        database: process.env.PGDATABASE || '',
        user: process.env.PGUSER || '',
        password: process.env.PGPASSWORD,
      };
if (nodeEnv !== 'test' && !databaseUrl && (!databaseConfig.database || !databaseConfig.user)) {
  throw new Error('Set DATABASE_URL or PGDATABASE and PGUSER in backend/.env to configure PostgreSQL.');
}
if (nodeEnv !== 'test' && !databaseUrl && typeof databaseConfig.password !== 'string') {
  throw new Error('Set PGPASSWORD in backend/.env to configure PostgreSQL authentication.');
}
if (nodeEnv !== 'test' && !databaseUrl && databaseConfig.password.length === 0) {
  throw new Error('PGPASSWORD must not be empty.');
}

const host = process.env.HOST || '127.0.0.1';
if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1' && host !== '0.0.0.0' && host !== '::') {
  throw new Error('HOST must be a hostname or IP address.');
}

const appBaseUrl = new URL(process.env.APP_BASE_URL || configOriginFallback());
if (!['http:', 'https:'].includes(appBaseUrl.protocol)
  || (nodeEnv === 'production' && appBaseUrl.protocol !== 'https:')
  || appBaseUrl.pathname !== '/' || appBaseUrl.username || appBaseUrl.password || appBaseUrl.search || appBaseUrl.hash) {
  throw new Error('APP_BASE_URL must be an HTTP(S) origin without credentials, path, query, or fragment; production requires HTTPS.');
}

function configOriginFallback() {
  return parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')[0];
}

export const config = Object.freeze({
  nodeEnv,
  host,
  port: parsePort(process.env.PORT || '3000'),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'),
  sessionTtlMs: parseSessionTtl(process.env.SESSION_TTL_HOURS || '8'),
  appBaseUrl: appBaseUrl.origin,
  resend: Object.freeze({
    apiKey: process.env.RESEND_API_KEY?.trim() || '',
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim() || '',
  }),
  databaseConfig,
  dataDir: path.resolve(backendRoot, process.env.DATA_DIR || 'data'),
});
