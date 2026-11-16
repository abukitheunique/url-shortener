import { useEffect, useRef, useState } from 'react'
import { Link2, Copy, Check, Trash2, MousePointerClick, Hash, ArrowRight, Globe, Sparkles, ExternalLink } from 'lucide-react'
import { getLinks, createLink, deleteLink } from './api'

const HOST = (import.meta.env.VITE_API_URL || 'localhost:5000').replace(/^https?:\/\//, '')

function CountUp({ value }) {
  const [shown, setShown] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min((t - t0) / 700, 1)
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{shown}</>
}

function Favicon({ host }) {
  const [bad, setBad] = useState(false)
  if (bad || !host) return <Globe size={20} className="opacity-60" />
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt=""
      width="24"
      height="24"
      className="rounded"
      onError={() => setBad(true)}
    />
  )
}

const hostOf = (u) => {
  try {
    return new URL(u).hostname
  } catch {
    return ''
  }
}

export default function App() {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [links, setLinks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')
  const [fresh, setFresh] = useState('')
  const [removing, setRemoving] = useState(() => new Set())
  const [toast, setToast] = useState(null)

  const say = (msg, type = 'ok') => {
    setToast({ msg, type, id: Date.now() })
    setTimeout(() => setToast((t) => (t && Date.now() - t.id >= 2000 ? null : t)), 2100)
  }

  useEffect(() => {
    getLinks()
      .then(setLinks)
      .catch(() => setError('Could not reach the server. It may be waking up, try again in a moment.'))
      .finally(() => setLoaded(true))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const link = await createLink(url.trim(), alias.trim())
      setLinks((l) => [link, ...l])
      setFresh(link.code)
      setTimeout(() => setFresh(''), 2300)
      setUrl('')
      setAlias('')
      say('Short link created')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copy(link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl)
      setCopied(link.code)
      setTimeout(() => setCopied(''), 1500)
      say('Copied to clipboard')
    } catch {
      say('Copy is not supported here', 'err')
    }
  }

  async function remove(code) {
    setRemoving((s) => new Set(s).add(code))
    try {
      await deleteLink(code)
      setTimeout(() => setLinks((l) => l.filter((x) => x.code !== code)), 300)
    } catch {
      setRemoving((s) => {
        const n = new Set(s)
        n.delete(code)
        return n
      })
      say('Could not delete the link', 'err')
    }
  }

  const totalClicks = links.reduce((a, l) => a + l.clicks, 0)
  const maxClicks = Math.max(0, ...links.map((l) => l.clicks))

  return (
    <>
      <div className="bg">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-10 md:py-14">
        <header className="mb-8 text-center" style={{ animation: 'rise .8s cubic-bezier(.2,.9,.3,1) both' }}>
          <div className="logo mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400">
            <Link2 size={26} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <span className="grad-text">Short Link</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Shorten. Share. Track every click.</p>
        </header>

        <form onSubmit={submit} className="glow-card space-y-3" style={{ animation: 'rise .9s .1s cubic-bezier(.2,.9,.3,1) both' }}>
          <div className="field">
            <Link2 size={18} />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/a/very/long/link"
              required
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="field flex-1">
              <Hash size={18} />
              <span className="prefix">{HOST}/</span>
              <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="custom-alias (optional)" />
            </div>
            <button className="btn flex items-center justify-center gap-2" disabled={busy}>
              {busy ? (
                <span className="spin" />
              ) : (
                <>
                  Shorten <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
          {error && <p className="px-1 text-sm text-rose-300">{error}</p>}
        </form>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="stat" style={{ animationDelay: '.2s' }}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Links</p>
            <p className="mt-1 text-2xl font-bold"><CountUp value={links.length} /></p>
          </div>
          <div className="stat" style={{ animationDelay: '.3s' }}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Total clicks</p>
            <p className="mt-1 text-2xl font-bold"><CountUp value={totalClicks} /></p>
          </div>
          <div className="stat" style={{ animationDelay: '.4s' }}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Top link</p>
            <p className="mt-1 text-2xl font-bold"><CountUp value={maxClicks} /></p>
          </div>
        </section>

        <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm text-slate-400">
          <Sparkles size={14} /> Your links
        </h2>

        {!loaded && (
          <div className="space-y-3">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        )}

        {loaded && links.length === 0 && !error && (
          <div className="py-10 text-center">
            <div className="floaty mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white/5">
              <Link2 size={28} className="text-indigo-300" />
            </div>
            <p className="text-slate-400">No links yet. Paste your first URL above.</p>
          </div>
        )}

        <ul className="space-y-3">
          {links.map((l, i) => (
            <li
              key={l.code}
              className={`item ${removing.has(l.code) ? 'removing' : ''}`}
              style={removing.has(l.code) ? undefined : { animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <div className={`row ${fresh === l.code ? 'fresh' : ''}`}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Favicon host={hostOf(l.url)} />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={l.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 truncate font-semibold text-cyan-300 hover:underline"
                  >
                    <span className="truncate">{l.shortUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={13} className="shrink-0 opacity-60" />
                  </a>
                  <p className="truncate text-xs text-slate-400" title={l.url}>{l.url}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs" title="Clicks">
                  <MousePointerClick size={13} /> {l.clicks}
                </span>
                <button onClick={() => copy(l)} title="Copy" className="icon-btn">
                  {copied === l.code ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
                <button onClick={() => remove(l.code)} title="Delete" className="icon-btn del">
                  <Trash2 size={18} />
                </button>
                <span className="bar" style={{ width: maxClicks ? `${Math.max(l.clicks ? 6 : 0, (l.clicks / maxClicks) * 100)}%` : '0%' }} />
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-xs text-slate-500">Made by abukitheunique</p>
      </main>

      {toast && <div key={toast.id} className={`toast ${toast.type === 'err' ? 'err' : ''}`}>{toast.msg}</div>}
    </>
  )
}
