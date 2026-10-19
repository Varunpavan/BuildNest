import { Router } from 'express'
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  generateProject,
} from '../controllers/project.controller.js'
import { protect } from '../middleware/auth.middleware.js'

let router = Router()

router.use(protect)

router.get('/', getProjects)
router.post('/', createProject)
router.get('/:id', getProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)
router.post('/:id/generate', generateProject)

export default router
