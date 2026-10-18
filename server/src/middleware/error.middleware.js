export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  })
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message)

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' })
  }

  if (err.name === 'ValidationError') {
    let firstMessage = Object.values(err.errors)[0]?.message || 'Validation failed'
    return res.status(400).json({ success: false, message: firstMessage })
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Record already exists' })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' })
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
}
