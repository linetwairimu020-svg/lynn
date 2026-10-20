import { createHash, randomBytes } from 'node:crypto';
import { withDocumentArray } from './documentStore.js';

const FILE_NAME = 'password-resets.json';
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function validateResetTokens(tokens) {
  if (!Array.isArray(tokens)) throw new Error(`${FILE_NAME} must contain a JSON array.`);
  const hashes = new Set();
  for (const reset of tokens) {
    if (!reset || typeof reset.tokenHash !== 'string' || !/^[a-f0-9]{64}$/.test(reset.tokenHash)
      || typeof reset.userId !== 'string' || !reset.userId
      || !Number.isFinite(Date.parse(reset.expiresAt))
      || hashes.has(reset.tokenHash)) {
      throw new Error(`${FILE_NAME} contains an invalid or duplicate reset token record.`);
    }
    hashes.add(reset.tokenHash);
  }
}

export const hashResetToken = (token) => createHash('sha256').update(token).digest('hex');

export async function createPasswordResetToken(userId, now = Date.now()) {
  const token = randomBytes(32).toString('base64url');
  const record = {
    tokenHash: hashResetToken(token),
    userId,
    expiresAt: new Date(now + PASSWORD_RESET_TTL_MS).toISOString(),
  };
  await withDocumentArray(FILE_NAME, validateResetTokens, async (tokens) => ({
    value: undefined,
    records: [...tokens.filter((item) => item.userId !== userId && Date.parse(item.expiresAt) > now), record],
    changed: true,
  }));
  return token;
}

export async function consumePasswordResetToken(token, now = Date.now()) {
  const tokenHash = hashResetToken(token);
  return withDocumentArray(FILE_NAME, validateResetTokens, async (tokens) => {
    const matched = tokens.find((item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt) > now);
    const records = tokens.filter((item) => item.tokenHash !== tokenHash && Date.parse(item.expiresAt) > now);
    return { value: matched?.userId || null, records, changed: records.length !== tokens.length };
  });
}

export async function deletePasswordResetToken(token) {
  const tokenHash = hashResetToken(token);
  await withDocumentArray(FILE_NAME, validateResetTokens, async (tokens) => {
    const records = tokens.filter((item) => item.tokenHash !== tokenHash);
    return { value: undefined, records, changed: records.length !== tokens.length };
  });
}
