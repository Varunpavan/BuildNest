import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// We only send back the safe fields, never the password
const formatUser = (user) => {
  return { id: user._id, name: user.name, email: user.email };
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are all required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password needs at least 6 characters.' });
  }

  const emailTaken = await User.findOne({ email: email.toLowerCase() });
  if (emailTaken) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Try logging in.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    success: true,
    token: createToken(user._id),
    user: formatUser(user),
  });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter your email and password.' });
  }

  // the password is hidden by default, so we ask for it with +password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // same message for "no user" and "wrong password" so nobody can guess which emails exist
  const wrongDetailsMessage = 'Email or password is incorrect.';

  if (!user) {
    return res.status(401).json({ success: false, message: wrongDetailsMessage });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: wrongDetailsMessage });
  }

  res.json({
    success: true,
    token: createToken(user._id),
    user: formatUser(user),
  });
};

// GET /api/auth/me  (the client calls this on page load to check the saved token)
export const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};
