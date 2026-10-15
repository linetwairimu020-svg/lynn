import { Router } from 'express';
import { currentUser, issueCsrf, login, logout, register } from '../controllers/auth.controller.js';
import { loadOptionalAuth } from '../middleware/auth.js';
import { validateCsrf, requireSessionCsrf } from '../middleware/csrf.js';
import { asyncRoute } from '../middleware/errorHandler.js';
import { loginRateLimit, registrationRateLimit } from '../middleware/authRateLimit.js';

const authRouter = Router();

authRouter.get('/auth/csrf', asyncRoute(issueCsrf));
authRouter.post('/auth/register', registrationRateLimit, validateCsrf, asyncRoute(register));
authRouter.post('/auth/login', loginRateLimit, loadOptionalAuth, requireSessionCsrf, asyncRoute(login));
authRouter.get('/auth/me', asyncRoute(currentUser));
authRouter.post('/auth/logout', loadOptionalAuth, requireSessionCsrf, asyncRoute(logout));

export default authRouter;
