import { randomUUID } from 'node:crypto';
import { HttpError } from '../middleware/errorHandler.js';
import { withJsonArray } from './jsonArrayStore.js';

const FILE_NAME = 'users.json';

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateUsers(users) {
  if (!Array.isArray(users)) throw new Error(`${FILE_NAME} must contain a JSON array.`);
  const ids = new Set();
  const emails = new Set();
  for (const user of users) {
    if (!user || typeof user.id !== 'string' || !user.id
      || typeof user.name !== 'string' || !user.name
      || typeof user.email !== 'string' || !user.email
      || typeof user.emailNormalized !== 'string' || !user.emailNormalized
      || typeof user.passwordHash !== 'string' || !user.passwordHash
      || !['user', 'admin'].includes(user.role)
      || typeof user.createdAt !== 'string'
      || ids.has(user.id)
      || emails.has(user.emailNormalized)
      || normalizeEmail(user.email) !== user.emailNormalized) {
      throw new Error(`${FILE_NAME} contains an invalid or duplicate user record.`);
    }
    ids.add(user.id);
    emails.add(user.emailNormalized);
  }
}

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmail(email) {
  const emailNormalized = normalizeEmail(email);
  return withJsonArray(FILE_NAME, validateUsers, async (users) => ({
    value: users.find((user) => user.emailNormalized === emailNormalized) || null,
    changed: false,
  }));
}

export async function findUserById(id) {
  return withJsonArray(FILE_NAME, validateUsers, async (users) => ({
    value: users.find((user) => user.id === id) || null,
    changed: false,
  }));
}

export async function initializeUserStore() {
  await withJsonArray(FILE_NAME, validateUsers, async () => ({ value: undefined, changed: false }));
}

function makeUser({ name, email, passwordHash, role = 'user' }) {
  const emailNormalized = normalizeEmail(email);
  return {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim(),
    emailNormalized,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
}

export async function createUser(details) {
  return withJsonArray(FILE_NAME, validateUsers, async (users) => {
    const emailNormalized = normalizeEmail(details.email);
    if (users.some((user) => user.emailNormalized === emailNormalized)) {
      throw new HttpError(409, 'EMAIL_IN_USE', 'An account with that email already exists.');
    }
    const user = makeUser({ ...details, role: 'user' });
    return { value: user, records: [...users, user], changed: true };
  });
}

export async function provisionAdmin(details) {
  return withJsonArray(FILE_NAME, validateUsers, async (users) => {
    const emailNormalized = normalizeEmail(details.email);
    const existingIndex = users.findIndex((user) => user.emailNormalized === emailNormalized);
    if (existingIndex === -1) {
      const user = makeUser({ ...details, role: 'admin' });
      return { value: user, records: [...users, user], changed: true };
    }
    const existing = users[existingIndex];
    const updated = {
      ...existing,
      name: details.name.trim(),
      email: details.email.trim(),
      passwordHash: details.passwordHash,
      role: 'admin',
    };
    const records = [...users];
    records[existingIndex] = updated;
    return { value: updated, records, changed: true };
  });
}
