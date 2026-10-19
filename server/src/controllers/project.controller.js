import mongoose from 'mongoose'
import Project from '../models/project.model.js'
import { generatePage } from '../services/gemini.service.js'

// In-memory concurrency guard to prevent overlapping builds on the same project
let activeGenerations = new Set()

export async function getProjects(req, res) {
  let projects = await Project.find({ user: req.user._id })
    .select('title code updatedAt')
    .sort({ updatedAt: -1 })
    .lean()

  res.json({ success: true, projects })
}

export async function createProject(req, res) {
  let title = req.body && req.body.title
  let project = await Project.create({ user: req.user._id, title })

  res.status(201).json({ success: true, project })
}

export async function getProject(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID format.' })
  }

  let project = await Project.findOne({ _id: req.params.id, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  res.json({ success: true, project })
}

export async function updateProject(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID format.' })
  }

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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID format.' })
  }

  let project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  res.json({ success: true, message: 'Project deleted.' })
}

export async function generateProject(req, res) {
  let projectId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID format.' })
  }

  let { prompt } = req.body || {}

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ success: false, message: 'Describe what you want to build or change first.' })
  }

  if (prompt.length > 2000) {
    return res.status(400).json({ success: false, message: 'That prompt is too long. Keep it under 2000 characters.' })
  }

  if (activeGenerations.has(projectId)) {
    return res.status(409).json({
      success: false,
      message: 'A build is already in progress for this project. Please wait a moment.',
    })
  }

  let project = await Project.findOne({ _id: projectId, user: req.user._id })

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' })
  }

  activeGenerations.add(projectId)

  try {
    let result = await generatePage({
      prompt: prompt.trim(),
      currentCode: project.code,
      history: project.messages.slice(-6),
    })

    project.code = result.html
    project.messages.push({ role: 'user', text: prompt.trim() })
    project.messages.push({ role: 'ai', text: result.summary })

    if (project.title === 'Untitled project' && result.title) {
      project.title = result.title.slice(0, 80)
    }

    await project.save()
    res.json({ success: true, project })
  } catch (error) {
    console.error('Gemini error:', error.message)

    if (error.status === 429) {
      return res.status(429).json({ success: false, message: 'The AI is busy right now. Wait a minute and try again.' })
    }

    return res.status(502).json({ success: false, message: 'The AI could not build that. Try again, or word the request a little differently.' })
  } finally {
    activeGenerations.delete(projectId)
  }
}
