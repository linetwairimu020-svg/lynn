import argon2 from 'argon2';
import { config } from '../config/env.js';
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
import { createSession, deleteSession, deleteSessionsForUser, findSession } from '../services/sessionStore.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
  updateLastLogin,
  updateUserPassword,
} from '../services/userStore.js';
import {
  validateLogin,
  validatePasswordReset,
  validatePasswordResetRequest,
  validateRegistration,
} from '../services/authValidation.js';
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  deletePasswordResetToken,
} from '../services/passwordResetStore.js';
import { sendPasswordResetEmail } from '../services/resendEmail.js';

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
  const createdUser = await createUser({ ...details, passwordHash });
  const lastLoginAt = new Date().toISOString();
  const user = await updateLastLogin(createdUser.id, lastLoginAt);
  const session = await createSession(user.id);
  setAuthCookies(response, session.token, session.csrfToken, sessionCookieMaxAge());
  response.status(201).json({
    user: toPublicUser(user, session.createdAt),
    csrfToken: session.csrfToken,
  });
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
    response.json({ user: null });
    return;
  }
  setCsrfCookie(response, session.csrfToken, sessionCookieMaxAge());
  response.json({ user: toPublicUser(user, session.createdAt), csrfToken: session.csrfToken });
}

export async function logout(request, response) {
  await deleteSession(readCookie(request, SESSION_COOKIE));
  clearAuthCookies(response);
  response.json({ message: 'Signed out.' });
}

export async function requestPasswordReset(request, response) {
  const { email } = validatePasswordResetRequest(request.body);
  if (!config.resend.apiKey || !config.resend.fromEmail) {
    throw new HttpError(503, 'PASSWORD_RESET_UNAVAILABLE', 'Password reset is temporarily unavailable. Please try again later.');
  }

  const user = await findUserByEmail(email);
  if (user) {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = new URL('/reset-password', config.appBaseUrl);
    resetUrl.searchParams.set('token', token);
    try {
      await sendPasswordResetEmail(user.email, resetUrl.toString());
    } catch (error) {
      try {
        await deletePasswordResetToken(token);
      } catch (cleanupError) {
        console.error('Could not remove an undelivered password reset token:', cleanupError);
      }
      console.error('Password reset email delivery failed:', error);
    }
  }

  response.status(202).json({
    message: 'If an account exists for that email address, password reset instructions will arrive shortly.',
  });
}

export async function completePasswordReset(request, response) {
  const { token, password } = validatePasswordReset(request.body);
  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    throw new HttpError(400, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or has expired.');
  }
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await updateUserPassword(userId, passwordHash);
  if (!user) {
    throw new HttpError(400, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or has expired.');
  }
  await deleteSessionsForUser(userId);
  response.json({ message: 'Your password has been reset. Sign in with your new password.' });
}

export function adminAccess(request, response) {
  response.json({ user: request.auth.publicUser });
}
