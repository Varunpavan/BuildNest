import { Router } from 'express'
import authRoutes from './auth.routes.js'
import projectRoutes from './project.routes.js'

let router = Router()

router.get('/health', function (req, res) {
  res.json({ success: true, message: 'NxtBuild server is running' })
})

router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)

export default router
