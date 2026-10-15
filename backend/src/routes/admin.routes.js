import { Router } from 'express';
import { adminAccess } from '../controllers/auth.controller.js';
import { loadOptionalAuth, requireAdmin, requireAuthenticated } from '../middleware/auth.js';
import { requireSessionCsrf } from '../middleware/csrf.js';
import {
  createAdminContent,
  deleteAdminContent,
  getAdminContent,
  getAdminOverview,
  updateAdminContent,
  updateAdminMessage,
  updateAdminSingleton,
} from '../controllers/content.controller.js';
import { asyncRoute } from '../middleware/errorHandler.js';

const adminRouter = Router();

adminRouter.use(loadOptionalAuth, requireAuthenticated, requireAdmin);
adminRouter.get('/access', adminAccess);
adminRouter.get('/overview', asyncRoute(getAdminOverview));
adminRouter.use((request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    next();
    return;
  }
  requireSessionCsrf(request, response, next);
});

for (const name of ['profile', 'settings']) {
  const setName = (request, _response, next) => {
    request.params.name = name;
    next();
  };
  adminRouter.get(`/${name}`, setName, asyncRoute(getAdminContent));
  adminRouter.put(`/${name}`, setName, asyncRoute(updateAdminSingleton));
}
adminRouter.get('/:name', asyncRoute(getAdminContent));
adminRouter.post('/:name', asyncRoute(createAdminContent));
adminRouter.patch('/messages/:id', asyncRoute(updateAdminMessage));
adminRouter.put('/:name/:id', asyncRoute(updateAdminContent));
adminRouter.delete('/:name/:id', asyncRoute(deleteAdminContent));

export default adminRouter;
