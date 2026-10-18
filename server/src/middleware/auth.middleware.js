import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Put this before any route that needs a logged in user.
// The client sends the token like:  Authorization: Bearer <token>
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'This account no longer exists.' });
    }

    // now every controller after this can use req.user
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
  }
};
