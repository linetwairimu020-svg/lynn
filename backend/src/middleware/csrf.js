import { randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { HttpError } from './errorHandler.js';

export const SESSION_COOKIE = 'lynn.sid';
export const CSRF_COOKIE = 'lynn.csrf';

export function readCookie(request, name) {
  const cookies = request.headers.cookie?.split(';') || [];
  for (const part of cookies) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return '';
    }
  }
  return '';
}

function cookieOptions(maxAgeSeconds) {
  return `Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${config.nodeEnv === 'production' ? '; Secure' : ''}`;
}

export function setAuthCookies(response, token, csrfToken, maxAgeSeconds) {
  response.append('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(maxAgeSeconds)}; HttpOnly`);
  response.append('Set-Cookie', `${CSRF_COOKIE}=${encodeURIComponent(csrfToken)}; ${cookieOptions(maxAgeSeconds)}`);
}

export function setCsrfCookie(response, csrfToken, maxAgeSeconds) {
  response.append('Set-Cookie', `${CSRF_COOKIE}=${encodeURIComponent(csrfToken)}; ${cookieOptions(maxAgeSeconds)}`);
}

export function clearAuthCookies(response) {
  const expired = 'Path=/; SameSite=Lax; Max-Age=0';
  const secure = config.nodeEnv === 'production' ? '; Secure' : '';
  response.append('Set-Cookie', `${SESSION_COOKIE}=; ${expired}; HttpOnly${secure}`);
  response.append('Set-Cookie', `${CSRF_COOKIE}=; ${expired}${secure}`);
}

export function validateCsrf(request, _response, next) {
  const cookieToken = readCookie(request, CSRF_COOKIE);
  const headerToken = request.get('X-CSRF-Token');
  const origin = request.get('Origin');
  const cookieBytes = Buffer.from(cookieToken || '');
  const headerBytes = Buffer.from(headerToken || '');

  if (!cookieToken || !headerToken || cookieBytes.length !== headerBytes.length
    || !timingSafeEqual(cookieBytes, headerBytes)
    || (origin && origin !== `${request.protocol}://${request.get('host')}` && !request.app.locals.corsOrigins.includes(origin))) {
    next(new HttpError(403, 'CSRF_INVALID', 'The request could not be verified. Refresh the page and try again.'));
    return;
  }
  next();
}

export function createCsrfToken() {
  return randomBytes(32).toString('base64url');
}

export function requireSessionCsrf(request, response, next) {
  const session = request.auth?.session;
  if (session && readCookie(request, CSRF_COOKIE) !== session.csrfToken) {
    next(new HttpError(403, 'CSRF_INVALID', 'The request could not be verified. Refresh the page and try again.'));
    return;
  }
  validateCsrf(request, response, next);
}

export function sessionCookieMaxAge() {
  return Math.floor(config.sessionTtlMs / 1000);
}
