import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { validateHealthRequest } from '../middleware/validateHealthRequest.js';

const healthRouter = Router();

healthRouter.get('/health', validateHealthRequest, getHealth);

export default healthRouter;
