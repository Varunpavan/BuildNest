import mongoose from 'mongoose'

let messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

let projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [80, 'Title can be 80 characters at most'],
      default: 'Untitled project',
    },
    code: { type: String, default: '' },
    messages: [messageSchema],
  },
  { timestamps: true }
)

let Project = mongoose.model('Project', projectSchema)

export default Project
