import Project from '../models/project.model.js';
import { generatePage } from '../services/gemini.service.js';

// Every query below also checks  user: req.user._id
// so one user can never read or change another user's project.

// GET /api/projects  (dashboard list, newest edited first)
export const getProjects = async (req, res) => {
  const projects = await Project.find({ user: req.user._id })
    .select('title code updatedAt')
    .sort({ updatedAt: -1 });

  res.json({ success: true, projects });
};

// POST /api/projects
export const createProject = async (req, res) => {
  const title = req.body && req.body.title;
  const project = await Project.create({ user: req.user._id, title });

  res.status(201).json({ success: true, project });
};

// GET /api/projects/:id
export const getProject = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  res.json({ success: true, project });
};

// PUT /api/projects/:id  (rename or save hand-edited code)
export const updateProject = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const { title, code } = req.body || {};

  if (typeof title === 'string') {
    project.title = title.trim() || 'Untitled project';
  }
  if (typeof code === 'string') {
    project.code = code;
  }

  await project.save();
  res.json({ success: true, project });
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  res.json({ success: true, message: 'Project deleted.' });
};

// POST /api/projects/:id/generate  -> asks Gemini to build or change the page
export const generateProject = async (req, res) => {
  const { prompt } = req.body || {};

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ success: false, message: 'Describe what you want to build or change first.' });
  }

  // limit prompt length to prevent payload overflow
  if (prompt.length > 2000) {
    return res.status(400).json({ success: false, message: 'That prompt is too long. Keep it under 2000 characters.' });
  }

  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  let result;

  try {
    result = await generatePage({
      prompt: prompt.trim(),
      currentCode: project.code,
      history: project.messages.slice(-6),
    });
  } catch (error) {
    console.error('Gemini error:', error.message);

    if (error.status === 429) {
      return res.status(429).json({ success: false, message: 'The AI is busy right now. Wait a minute and try again.' });
    }

    return res.status(502).json({ success: false, message: 'The AI could not build that. Try again, or word the request a little differently.' });
  }

  project.code = result.html;
  project.messages.push({ role: 'user', text: prompt.trim() });
  project.messages.push({ role: 'ai', text: result.summary });

  // name the project after the first thing we built
  if (project.title === 'Untitled project' && result.title) {
    project.title = result.title.slice(0, 80);
  }

  await project.save();
  res.json({ success: true, project });
};
