import 'dotenv/config'
import app from './src/app.js'
import connectDB from './src/config/db.config.js'

let PORT = process.env.PORT || 5050

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in your .env file')
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('Warning: GEMINI_API_KEY is missing, so page generation will not work.')
    }

    await connectDB()

    app.listen(PORT, () => {
      console.log(`\n Server is running on port ${PORT}`)
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(` URL: http://localhost:${PORT}\n`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
