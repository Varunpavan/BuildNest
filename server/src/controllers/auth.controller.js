import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function formatUser(user) {
  return { id: user._id, name: user.name, email: user.email }
}

export async function signup(req, res) {
  let { name, email, password } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are all required.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password needs at least 6 characters.' })
  }

  let emailTaken = await User.findOne({ email: email.toLowerCase() })
  if (emailTaken) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Try logging in.' })
  }

  let hashedPassword = await bcrypt.hash(password, 10)
  let user = await User.create({ name, email, password: hashedPassword })

  res.status(201).json({
    success: true,
    token: createToken(user._id),
    user: formatUser(user),
  })
}

export async function login(req, res) {
  let { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter your email and password.' })
  }

  let user = await User.findOne({ email: email.toLowerCase() }).select('+password')
  let wrongDetailsMessage = 'Email or password is incorrect.'

  if (!user) {
    return res.status(401).json({ success: false, message: wrongDetailsMessage })
  }

  let passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: wrongDetailsMessage })
  }

  res.json({
    success: true,
    token: createToken(user._id),
    user: formatUser(user),
  })
}

export async function getMe(req, res) {
  res.json({ success: true, user: formatUser(req.user) })
}
