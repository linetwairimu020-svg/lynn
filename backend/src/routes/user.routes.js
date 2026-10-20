import { Router } from 'express';
import { updatePreferences } from '../controllers/user.controller.js';
import { loadOptionalAuth, requireAuthenticated } from '../middleware/auth.js';
import { requireSessionCsrf } from '../middleware/csrf.js';
import { asyncRoute } from '../middleware/errorHandler.js';

const userRouter = Router();

userRouter.patch('/preferences', loadOptionalAuth, requireAuthenticated, requireSessionCsrf, asyncRoute(updatePreferences));

export default userRouter;
