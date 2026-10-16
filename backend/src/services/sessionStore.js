import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config/env.js';
import { withDocumentArray } from './documentStore.js';

const FILE_NAME = 'sessions.json';

function validateSessions(sessions) {
  if (!Array.isArray(sessions)) throw new Error(`${FILE_NAME} must contain a JSON array.`);
  const tokenHashes = new Set();
  for (const session of sessions) {
    if (!session || typeof session.tokenHash !== 'string' || !session.tokenHash
      || typeof session.userId !== 'string' || !session.userId
      || typeof session.csrfToken !== 'string' || !session.csrfToken
      || !Number.isFinite(Date.parse(session.expiresAt))
      || tokenHashes.has(session.tokenHash)) {
      throw new Error(`${FILE_NAME} contains an invalid or duplicate session record.`);
    }
    tokenHashes.add(session.tokenHash);
  }
}

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');
  const session = {
    tokenHash: hashToken(token),
    userId,
    csrfToken,
    expiresAt: new Date(Date.now() + config.sessionTtlMs).toISOString(),
  };
  await withDocumentArray(FILE_NAME, validateSessions, async (sessions) => ({
    value: undefined,
    records: [...sessions.filter((item) => Date.parse(item.expiresAt) > Date.now()), session],
    changed: true,
  }));
  return { token, csrfToken, expiresAt: session.expiresAt };
}

export async function findSession(token) {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = hashToken(token);
  return withDocumentArray(FILE_NAME, validateSessions, async (sessions) => {
    const active = sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
    const session = active.find((item) => item.tokenHash === tokenHash) || null;
    return {
      value: session,
      records: active,
      changed: active.length !== sessions.length,
    };
  });
}

export async function deleteSession(token) {
  if (!token || typeof token !== 'string') return;
  const tokenHash = hashToken(token);
  await withDocumentArray(FILE_NAME, validateSessions, async (sessions) => {
    const records = sessions.filter((session) => session.tokenHash !== tokenHash);
    return { value: undefined, records, changed: records.length !== sessions.length };
  });
}

export async function deleteSessionsForUser(userId) {
  await withDocumentArray(FILE_NAME, validateSessions, async (sessions) => {
    const records = sessions.filter((session) => session.userId !== userId);
    return { value: undefined, records, changed: records.length !== sessions.length };
  });
}

export async function initializeSessionStore() {
  await withDocumentArray(FILE_NAME, validateSessions, async (sessions) => {
    const records = sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
    return { value: undefined, records, changed: records.length !== sessions.length };
  });
}
