import mongoose from 'mongoose'

async function connectDB() {
  try {
    let mongoURI = process.env.MONGODB_URI

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in your .env file')
    }

    let conn = await mongoose.connect(mongoURI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
