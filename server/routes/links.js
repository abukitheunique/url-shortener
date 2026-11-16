import { Router } from 'express'
import crypto from 'node:crypto'
import Link from '../models.js'

const router = Router()
const BASE = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
const RESERVED = new Set(['api', 'health', 'admin', 'login', 'favicon.ico'])
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const makeCode = (n = 7) =>
  Array.from(crypto.randomBytes(n), (b) => ALPHABET[b % ALPHABET.length]).join('')

const out = (d) => ({
  code: d.code,
  url: d.url,
  clicks: d.clicks,
  createdAt: d.createdAt,
  shortUrl: `${BASE}/${d.code}`,
})

router.use((req, res, next) => {
  const id = req.header('x-user-id')
  if (!id || id.length < 8 || id.length > 64) return res.status(400).json({ error: 'Missing user id' })
  req.userId = id
  next()
})

router.get('/', async (req, res, next) => {
  try {
    const list = await Link.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100)
    res.json(list.map(out))
  } catch (e) {
    next(e)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const raw = String(req.body.url || '').trim()
    const alias = String(req.body.alias || '').trim()

    let parsed
    try {
      parsed = new URL(raw)
    } catch {
      return res.status(400).json({ error: 'Enter a valid URL, including https://' })
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || raw.length > 2048)
      return res.status(400).json({ error: 'Only http and https links are allowed' })
    if (parsed.host === new URL(BASE).host)
      return res.status(400).json({ error: 'That link is already shortened' })

    if (alias && !/^[a-zA-Z0-9_-]{3,30}$/.test(alias))
      return res.status(400).json({ error: 'Alias: 3-30 letters, numbers, - or _' })
    if (RESERVED.has(alias.toLowerCase()))
      return res.status(400).json({ error: 'That alias is reserved' })

    for (let i = 0; i < 5; i++) {
      try {
        const doc = await Link.create({ code: alias || makeCode(), url: parsed.href, userId: req.userId })
        return res.status(201).json(out(doc))
      } catch (e) {
        if (e.code !== 11000) throw e
        if (alias) return res.status(409).json({ error: 'That alias is already taken' })
      }
    }
    res.status(500).json({ error: 'Could not generate a code, try again' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:code', async (req, res, next) => {
  try {
    await Link.deleteOne({ code: req.params.code, userId: req.userId })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
