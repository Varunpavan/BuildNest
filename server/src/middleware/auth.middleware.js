import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export async function protect(req, res, next) {
  let header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' })
  }

  let token = header.split(' ')[1]

  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET)
    let user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ success: false, message: 'This account no longer exists.' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' })
  }
}
