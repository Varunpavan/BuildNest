import Project from '../models/project.model.js'
import { generatePage } from '../services/gemini.service.js'

export async function getProjects(req, res) {
  let projects = await Project.find({ user: req.user._id })
    .select('title code updatedAt')
    .sort({ updatedAt: -1 })

  res.json({ success: true, projects })
}

export async function createProject(req, res) {
  let title = req.body && req.body.title
  let project = await Project.create({ user: req.user._id, title })

  res.status(201).json({ success: true, project })
}

export async function getProject(req, res) {
  let project = await Project.findOne({ _id: req.params.id, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  res.json({ success: true, project })
}

export async function updateProject(req, res) {
  let project = await Project.findOne({ _id: req.params.id, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  let { title, code } = req.body || {}

  if (typeof title === 'string') {
    project.title = title.trim() || 'Untitled project'
  }
  if (typeof code === 'string') {
    project.code = code
  }

  await project.save()
  res.json({ success: true, project })
}

export async function deleteProject(req, res) {
  let project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  res.json({ success: true, message: 'Project deleted.' })
}

export async function generateProject(req, res) {
  let { prompt } = req.body || {}

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ success: false, message: 'Describe what you want to build or change first.' })
  }

  if (prompt.length > 2000) {
    return res.status(400).json({ success: false, message: 'That prompt is too long. Keep it under 2000 characters.' })
  }

  let project = await Project.findOne({ _id: req.params.id, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  let result

  try {
    result = await generatePage({
      prompt: prompt.trim(),
      currentCode: project.code,
      history: project.messages.slice(-6),
    })
  } catch (error) {
    console.error('Gemini error:', error.message)

    if (error.status === 429) {
      return res.status(429).json({ success: false, message: 'The AI is busy right now. Wait a minute and try again.' })
    }

    return res.status(502).json({ success: false, message: 'The AI could not build that. Try again, or word the request a little differently.' })
  }

  project.code = result.html
  project.messages.push({ role: 'user', text: prompt.trim() })
  project.messages.push({ role: 'ai', text: result.summary })

  if (project.title === 'Untitled project' && result.title) {
    project.title = result.title.slice(0, 80)
  }

  await project.save()
  res.json({ success: true, project })
}
