import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Link', schema)
