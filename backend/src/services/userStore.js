import { randomUUID } from 'node:crypto';
import { HttpError } from '../middleware/errorHandler.js';
import { withDocumentArray } from './documentStore.js';

const FILE_NAME = 'users.json';
const DEFAULT_PREFERENCES = {
  email: false,
  sms: false,
  push: false,
  region: '',
  timezone: 'UTC',
};

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateUsers(users) {
  if (!Array.isArray(users)) throw new Error(`${FILE_NAME} must contain a JSON array.`);
  const ids = new Set();
  const emails = new Set();
  for (const user of users) {
    const validPreferences = user?.preferences === undefined || (
      user.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences)
      && Object.entries(user.preferences).every(([key, value]) => {
        if (['email', 'sms', 'push'].includes(key)) return typeof value === 'boolean';
        if (key === 'region') return typeof value === 'string';
        if (key === 'timezone') {
          if (typeof value !== 'string') return false;
          try {
            new Intl.DateTimeFormat('en', { timeZone: value }).format();
            return true;
          } catch {
            return false;
          }
        }
        return false;
      })
    );
    if (!user || typeof user.id !== 'string' || !user.id
      || typeof user.name !== 'string' || !user.name
      || typeof user.email !== 'string' || !user.email
      || typeof user.emailNormalized !== 'string' || !user.emailNormalized
      || (user.phone !== undefined && (typeof user.phone !== 'string' || !user.phone))
      || typeof user.passwordHash !== 'string' || !user.passwordHash
      || !['user', 'admin'].includes(user.role)
      || typeof user.createdAt !== 'string'
      || (user.lastLoginAt !== undefined && !Number.isFinite(Date.parse(user.lastLoginAt)))
      || !validPreferences
      || (user.avatarUrl !== undefined && typeof user.avatarUrl !== 'string')
      || (user.location !== undefined && typeof user.location !== 'string')
      || (user.integrations !== undefined && (!Array.isArray(user.integrations)
        || user.integrations.some((integration) => !integration || typeof integration.provider !== 'string'
          || !['google', 'github', 'calendar'].includes(integration.provider)
          || !Number.isFinite(Date.parse(integration.connectedAt)))))
      || ids.has(user.id)
      || emails.has(user.emailNormalized)
      || normalizeEmail(user.email) !== user.emailNormalized) {
      throw new Error(`${FILE_NAME} contains an invalid or duplicate user record.`);
    }
    ids.add(user.id);
    emails.add(user.emailNormalized);
  }
}

export function toPublicUser(user, sessionStartedAt) {
  const nameParts = user.name.trim().split(/\s+/);
  const preferences = { ...DEFAULT_PREFERENCES, ...user.preferences };
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName || nameParts[0],
    lastName: user.lastName || nameParts.slice(1).join(' '),
    avatarUrl: user.avatarUrl || '',
    location: user.location || preferences.region,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
    preferences,
    integrations: user.integrations || [],
    ...(sessionStartedAt ? { sessionStartedAt } : {}),
  };
}

export async function findUserByEmail(email) {
  const emailNormalized = normalizeEmail(email);
  return withDocumentArray(FILE_NAME, validateUsers, async (users) => ({
    value: users.find((user) => user.emailNormalized === emailNormalized) || null,
    changed: false,
  }));
}

export async function findUserById(id) {
  return withDocumentArray(FILE_NAME, validateUsers, async (users) => ({
    value: users.find((user) => user.id === id) || null,
    changed: false,
  }));
}

export async function initializeUserStore() {
  await withDocumentArray(FILE_NAME, validateUsers, async () => ({ value: undefined, changed: false }));
}

function makeUser({ name, email, phone, passwordHash, role = 'user' }) {
  const nameParts = name.trim().split(/\s+/);
  const emailNormalized = normalizeEmail(email);
  return {
    id: randomUUID(),
    name: name.trim(),
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' '),
    email: email.trim(),
    emailNormalized,
    ...(phone ? { phone: phone.trim() } : {}),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
    preferences: { ...DEFAULT_PREFERENCES },
    integrations: [],
  };
}

export async function createUser(details) {
  return withDocumentArray(FILE_NAME, validateUsers, async (users) => {
    const emailNormalized = normalizeEmail(details.email);
    if (users.some((user) => user.emailNormalized === emailNormalized)) {
      throw new HttpError(409, 'EMAIL_IN_USE', 'An account with that email already exists.');
    }
    const user = makeUser({ ...details, role: 'user' });
    return { value: user, records: [...users, user], changed: true };
  });
}

export async function updateLastLogin(id, lastLoginAt = new Date().toISOString()) {
  return withDocumentArray(FILE_NAME, validateUsers, async (users) => {
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) return { value: null, changed: false };
    const updated = { ...users[index], lastLoginAt };
    const records = [...users];
    records[index] = updated;
    return { value: updated, records, changed: true };
  });
}

export async function updateUserPreferences(id, changes) {
  return withDocumentArray(FILE_NAME, validateUsers, async (users) => {
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) return { value: null, changed: false };
    const updated = {
      ...users[index],
      preferences: { ...DEFAULT_PREFERENCES, ...users[index].preferences, ...changes },
    };
    const records = [...users];
    records[index] = updated;
    return { value: updated, records, changed: true };
  });
}

export async function provisionAdmin({ email }) {
  return withDocumentArray(FILE_NAME, validateUsers, async (users) => {
    const emailNormalized = normalizeEmail(email);
    const existingIndex = users.findIndex((user) => user.emailNormalized === emailNormalized);
    if (existingIndex === -1) {
      throw new Error(`No existing account matches ${emailNormalized}; register the account before provisioning it.`);
    }

    const existing = users[existingIndex];
    if (existing.role === 'admin') return { value: existing, changed: false };

    const updated = { ...existing, role: 'admin' };
    const records = [...users];
    records[existingIndex] = updated;
    return { value: updated, records, changed: true };
  });
}
