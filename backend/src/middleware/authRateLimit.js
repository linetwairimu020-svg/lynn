import { rateLimit } from 'express-rate-limit';
import { HttpError } from './errorHandler.js';

function createLimiter(max, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_request, _response, next) {
      next(new HttpError(429, 'RATE_LIMITED', message));
    },
  });
}

export const loginRateLimit = createLimiter(10, 'Too many sign-in attempts. Try again in 15 minutes.');
export const registrationRateLimit = createLimiter(10, 'Too many registration attempts. Try again in 15 minutes.');
export const passwordResetRequestRateLimit = createLimiter(5, 'Too many password reset requests. Try again in 15 minutes.');
export const passwordResetCompleteRateLimit = createLimiter(10, 'Too many password reset attempts. Try again in 15 minutes.');
export const contactRateLimit = createLimiter(5, 'Too many contact messages. Try again in 15 minutes.');
