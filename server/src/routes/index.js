import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';

const router = Router();

// quick way to check the server is alive: GET /api/health
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'NxtBuild server is running' });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

export default router;
