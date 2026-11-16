import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import links from './routes/links.js'
import Link from './models.js'

const app = express()
app.set('trust proxy', 1)
app.use(cors({ origin: process.env.CLIENT_URL || true }))
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }))
app.use('/api/links', rateLimit({ windowMs: 60_000, limit: 40 }), links)

app.get('/:code', async (req, res, next) => {
  try {
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(req.params.code)) return res.status(404).send('Not found')
    const doc = await Link.findOneAndUpdate({ code: req.params.code }, { $inc: { clicks: 1 } })
    if (!doc) return res.status(404).send('Link not found')
    res.redirect(302, doc.url)
  } catch (e) {
    next(e)
  }
})

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json({ error: 'Server error' })
})

const port = process.env.PORT || 5000
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(port, () => console.log(`API running on http://localhost:${port}`))
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message)
    process.exit(1)
  })
