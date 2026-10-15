import { HttpError } from '../middleware/errorHandler.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !['name', 'email', 'password'].includes(key))) {
    throw new HttpError(400, 'INVALID_REGISTRATION', 'Provide only a name, email, and password.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (name.length < 2 || name.length > 120) {
    throw new HttpError(400, 'INVALID_NAME', 'Name must be between 2 and 120 characters.');
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    throw new HttpError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  }
  if (password.length < 12 || password.length > 128
    || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'INVALID_PASSWORD', 'Use 12 to 128 characters, including uppercase, lowercase, and a number.');
  }
  return { name, email, password };
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
