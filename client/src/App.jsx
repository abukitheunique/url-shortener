import { useEffect, useState } from 'react'
import { Link2, Copy, Check, Trash2, MousePointerClick } from 'lucide-react'
import { getLinks, createLink, deleteLink } from './api'

export default function App() {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [links, setLinks] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    getLinks().then(setLinks).catch(() => setError('Could not reach the server'))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const link = await createLink(url.trim(), alias.trim())
      setLinks((l) => [link, ...l])
      setUrl('')
      setAlias('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copy(link) {
    await navigator.clipboard.writeText(link.shortUrl)
    setCopied(link.code)
    setTimeout(() => setCopied(''), 1500)
  }

  async function remove(code) {
    await deleteLink(code)
    setLinks((l) => l.filter((x) => x.code !== code))
  }

  return (
    <main className="mx-auto max-w-2xl p-4 md:p-8">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400">
          <Link2 />
        </div>
        <h1 className="text-3xl font-bold">Short Link</h1>
        <p className="mt-1 text-sm opacity-60">Paste a long URL and get a short one you can share.</p>
      </header>

      <form onSubmit={submit} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/very/long/link"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-400"
          required
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Custom alias (optional)"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-400"
          />
          <button
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 font-semibold transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Shortening...' : 'Shorten'}
          </button>
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </form>

      <h2 className="mb-3 mt-8 text-sm opacity-60">Your links ({links.length})</h2>
      {links.length === 0 && <p className="opacity-50">No links yet.</p>}

      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.code} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="min-w-0 flex-1">
              <a href={l.shortUrl} target="_blank" rel="noreferrer" className="block truncate font-semibold text-cyan-300 hover:underline">
                {l.shortUrl}
              </a>
              <p className="truncate text-xs opacity-50" title={l.url}>{l.url}</p>
            </div>
            <span className="flex items-center gap-1 text-xs opacity-70" title="Clicks">
              <MousePointerClick size={14} /> {l.clicks}
            </span>
            <button onClick={() => copy(l)} title="Copy" className="rounded-lg p-2 hover:bg-white/10">
              {copied === l.code ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
            <button onClick={() => remove(l.code)} title="Delete" className="rounded-lg p-2 hover:bg-white/10 hover:text-rose-300">
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
