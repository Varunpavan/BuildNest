// ============================================
// error.middleware.js - Global Error Handling
// ============================================
// Catches errors from anywhere in the app and
// sends a clean error response to the client.
//
// Express 5.x automatically catches async errors,
// so we don't need express-async-errors!
//
// Status codes we use:
//   400 = Bad request (invalid id, failed validation)
//   404 = Not Found (route doesn't exist)
//   409 = Conflict (duplicate email)
//   500 = Server Error (something broke)
// ============================================

/**
 * 404 Handler - When a route doesn't exist.
 * Example: GET /api/nonexistent → "Route not found"
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global Error Handler - Catches all unhandled errors.
 *
 * Express knows this is an error handler because
 * it has 4 parameters: (err, req, res, next)
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // a bad id like /api/projects/abc
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'That id is not valid.' });
  }

  // a mongoose validation problem (a required field is missing, text too long...)
  if (err.name === 'ValidationError') {
    const firstMessage = Object.values(err.errors)[0].message;
    return res.status(400).json({ success: false, message: firstMessage });
  }

  // code 11000 means a unique field (like email) already exists
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'That value is already in use.' });
  }

  // invalid JSON sent in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'The request body is not valid JSON.' });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.',
  });
};
