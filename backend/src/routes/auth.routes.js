import { Router } from 'express';
import {
  completePasswordReset,
  currentUser,
  issueCsrf,
  login,
  logout,
  register,
  requestPasswordReset,
} from '../controllers/auth.controller.js';
import { loadOptionalAuth } from '../middleware/auth.js';
import { validateCsrf, requireSessionCsrf } from '../middleware/csrf.js';
import { asyncRoute } from '../middleware/errorHandler.js';
import {
  loginRateLimit,
  passwordResetCompleteRateLimit,
  passwordResetRequestRateLimit,
  registrationRateLimit,
} from '../middleware/authRateLimit.js';

const authRouter = Router();

authRouter.get('/auth/csrf', asyncRoute(issueCsrf));
authRouter.post('/auth/register', registrationRateLimit, validateCsrf, asyncRoute(register));
authRouter.post('/auth/login', loginRateLimit, loadOptionalAuth, requireSessionCsrf, asyncRoute(login));
authRouter.post('/auth/password-reset', passwordResetRequestRateLimit, asyncRoute(requestPasswordReset));
authRouter.post('/auth/password-reset/confirm', passwordResetCompleteRateLimit, asyncRoute(completePasswordReset));
authRouter.get('/auth/me', asyncRoute(currentUser));
authRouter.post('/auth/logout', loadOptionalAuth, requireSessionCsrf, asyncRoute(logout));

export default authRouter;
