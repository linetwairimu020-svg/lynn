import { Router } from 'express';
import { submitContactMessage, getPublicContent } from '../controllers/content.controller.js';
import { validateCsrf } from '../middleware/csrf.js';
import { asyncRoute } from '../middleware/errorHandler.js';
import { contactRateLimit } from '../middleware/authRateLimit.js';

const contentRouter = Router();

contentRouter.get('/content/:name', asyncRoute(getPublicContent));
contentRouter.post('/contact-messages', contactRateLimit, validateCsrf, asyncRoute(submitContactMessage));

export default contentRouter;
