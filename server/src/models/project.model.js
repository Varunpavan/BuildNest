import mongoose from 'mongoose';

// One chat message inside a project. role is either "user" or "ai"
const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const projectSchema = new mongoose.Schema(
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
    // generated full HTML page with inline CSS and JS
    code: { type: String, default: '' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
