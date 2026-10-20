import { HttpError } from '../middleware/errorHandler.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128
    || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'INVALID_PASSWORD', 'Use 12 to 128 characters, including uppercase, lowercase, and a number.');
  }
  return password;
}

export function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !['name', 'email', 'password', 'phone'].includes(key))) {
    throw new HttpError(400, 'INVALID_REGISTRATION', 'Provide a name, email, password, and optional phone number.');
  }
  if (body.phone !== undefined && typeof body.phone !== 'string') {
    throw new HttpError(400, 'INVALID_PHONE', 'Enter a valid phone number.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const phone = body.phone?.trim() || '';
  if (name.length < 2 || name.length > 120) {
    throw new HttpError(400, 'INVALID_NAME', 'Name must be between 2 and 120 characters.');
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    throw new HttpError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  }
  validatePassword(password);
  if (phone && (phone.length > 30 || !/^\+?[0-9\s().-]{7,29}$/.test(phone) || phone.replace(/\D/g, '').length < 7)) {
    throw new HttpError(400, 'INVALID_PHONE', 'Enter a valid phone number.');
  }
  return { name, email, password, ...(phone ? { phone } : {}) };
}

export function validateLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !['email', 'password'].includes(key))
    || typeof body.email !== 'string' || !emailPattern.test(body.email.trim())
    || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 128) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  return { email: body.email.trim(), password: body.password };
}

export function validatePasswordResetRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => key !== 'email')
    || typeof body.email !== 'string' || body.email.trim().length > 254
    || !emailPattern.test(body.email.trim())) {
    throw new HttpError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  }
  return { email: body.email.trim() };
}

export function validatePasswordReset(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !['token', 'password'].includes(key))
    || typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token)) {
    throw new HttpError(400, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or has expired.');
  }
  return { token: body.token, password: validatePassword(body.password) };
}
