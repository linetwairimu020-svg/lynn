import { HttpError, asyncRoute } from './errorHandler.js';
import { readCookie, SESSION_COOKIE } from './csrf.js';
import { findSession } from '../services/sessionStore.js';
import { findUserById, toPublicUser } from '../services/userStore.js';

export const loadOptionalAuth = asyncRoute(async (request, _response, next) => {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await findSession(token);
  const user = session ? await findUserById(session.userId) : null;
  request.auth = session && user ? { session, user } : null;
  next();
});

export function requireAuthenticated(request, _response, next) {
  if (!request.auth) {
    next(new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.'));
    return;
  }
  next();
}

export function requireAdmin(request, _response, next) {
  if (request.auth?.user.role !== 'admin') {
    next(new HttpError(403, 'ADMIN_REQUIRED', 'Administrator access is required.'));
    return;
  }
  request.auth.publicUser = toPublicUser(request.auth.user);
  next();
}
