import { HttpError } from '../middleware/errorHandler.js';
import { toPublicUser, updateUserPreferences } from '../services/userStore.js';

const preferenceKeys = new Set(['email', 'sms', 'push', 'region', 'timezone']);

function validatePreferences(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length === 0
    || Object.keys(body).some((key) => !preferenceKeys.has(key))) {
    throw new HttpError(400, 'INVALID_PREFERENCES', 'Provide one or more supported preference fields.');
  }
  const changes = {};
  for (const key of ['email', 'sms', 'push']) {
    if (key in body) {
      if (typeof body[key] !== 'boolean') {
        throw new HttpError(400, 'INVALID_PREFERENCES', `${key} must be a boolean.`);
      }
      changes[key] = body[key];
    }
  }
  if ('region' in body) {
    if (typeof body.region !== 'string' || body.region.trim().length > 100) {
      throw new HttpError(400, 'INVALID_PREFERENCES', 'Region must be a string of at most 100 characters.');
    }
    changes.region = body.region.trim();
  }
  if ('timezone' in body) {
    if (typeof body.timezone !== 'string' || body.timezone.length > 100) {
      throw new HttpError(400, 'INVALID_PREFERENCES', 'Enter a valid timezone.');
    }
    try {
      new Intl.DateTimeFormat('en', { timeZone: body.timezone }).format();
    } catch {
      throw new HttpError(400, 'INVALID_PREFERENCES', 'Enter a valid timezone.');
    }
    changes.timezone = body.timezone;
  }
  return changes;
}

export async function updatePreferences(request, response) {
  const changes = validatePreferences(request.body);
  const user = await updateUserPreferences(request.auth.user.id, changes);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'The account could not be found.');
  response.json({ user: toPublicUser(user, request.auth.session.createdAt) });
}
