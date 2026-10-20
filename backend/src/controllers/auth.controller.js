import argon2 from 'argon2';
import { HttpError } from '../middleware/errorHandler.js';
import {
  clearAuthCookies,
  createCsrfToken,
  readCookie,
  SESSION_COOKIE,
  sessionCookieMaxAge,
  setAuthCookies,
  setCsrfCookie,
} from '../middleware/csrf.js';
import { createSession, deleteSession, findSession } from '../services/sessionStore.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
  updateLastLogin,
} from '../services/userStore.js';
import { validateLogin, validateRegistration } from '../services/authValidation.js';

export async function issueCsrf(request, response) {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await findSession(token);
  const csrfToken = session?.csrfToken || createCsrfToken();
  setCsrfCookie(response, csrfToken, sessionCookieMaxAge());
  response.json({ csrfToken });
}

export async function register(request, response) {
  const details = validateRegistration(request.body);
  const passwordHash = await argon2.hash(details.password, { type: argon2.argon2id });
  const user = await createUser({ ...details, passwordHash });
  response.status(201).json({ user: toPublicUser(user) });
}

export async function login(request, response) {
  const credentials = validateLogin(request.body);
  const user = await findUserByEmail(credentials.email);
  if (!user || !(await argon2.verify(user.passwordHash, credentials.password).catch(() => false))) {
    if (!user) await argon2.hash(credentials.password, { type: argon2.argon2id });
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  const lastLoginAt = new Date().toISOString();
  const updatedUser = await updateLastLogin(user.id, lastLoginAt);
  const session = await createSession(user.id);
  setAuthCookies(response, session.token, session.csrfToken, sessionCookieMaxAge());
  response.json({ user: toPublicUser(updatedUser, session.createdAt), csrfToken: session.csrfToken });
}

export async function currentUser(request, response) {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await findSession(token);
  const user = session ? await findUserById(session.userId) : null;
  if (!session || !user) {
    clearAuthCookies(response);
    throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  }
  setCsrfCookie(response, session.csrfToken, sessionCookieMaxAge());
  response.json({ user: toPublicUser(user, session.createdAt), csrfToken: session.csrfToken });
}

export async function logout(request, response) {
  await deleteSession(readCookie(request, SESSION_COOKIE));
  clearAuthCookies(response);
  response.json({ message: 'Signed out.' });
}

export function adminAccess(request, response) {
  response.json({ user: request.auth.publicUser });
}
