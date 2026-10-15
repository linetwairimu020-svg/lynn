import { Router } from 'express';
import { adminAccess } from '../controllers/auth.controller.js';
import { loadOptionalAuth, requireAdmin, requireAuthenticated } from '../middleware/auth.js';
import { requireSessionCsrf } from '../middleware/csrf.js';

const adminRouter = Router();

adminRouter.use(loadOptionalAuth, requireAuthenticated, requireAdmin);
adminRouter.get('/access', adminAccess);
adminRouter.use((request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    next();
    return;
  }
  requireSessionCsrf(request, response, next);
});

export default adminRouter;
