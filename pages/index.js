import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

// ─── Helpers ────────────────────────────────────────────────
const pName = (p) => p ? `${p.first_name} ${p.last_name}` : '?'
const teamLabel = (pa, pb) => pb ? `${pName(pa)} / ${pName(pb)}` : pName(pa)

function setWinner(sets) {
  if (!sets || sets.length === 0) return null
  let w1 = 0, w2 = 0
  sets.forEach(s => { if (s.p1 > s.p2) w1++; else w2++ })
  if (w1 > w2) return 'team1'
  if (w2 > w1) return 'team2'
  return null
}

function Alert({ msg, type }) {
  if (!msg) return null
  return <div className={`alert alert-${type}`}>{msg}</div>
}

// ─── Header ─────────────────────────────────────────────────
function Header() {
  return (
    <header style={{
      background: '#fff', borderBottom: '0.5px solid var(--border)',
      padding: '0 1.5rem', marginBottom: '1.5rem'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--green)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: 15, flexShrink: 0
        }}>EK</div>
        <div>
          <h1 style={{ fontSize: 18 }}>East Kilbride Pickleball Championship</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Match recording & fixtures — share this page with the group</p>
        </div>
      </div>
    </header>
  )
}

// ─── Fixtures Tab ────────────────────────────────────────────
function FixturesTab({ fixtures, players }) {
  const [typeF, setTypeF] = useState('')
  const [statusF, setStatusF] = useState('')

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  const filtered = fixtures
    .filter(f => (!typeF || f.match_type === typeF) && (!statusF || f.status === statusF))
    .sort((a, b) => a.match_date > b.match_date ? 1 : -1)

  return (
    <>
      <div className="filter-bar">
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          <option>Singles</option><option>Doubles</option><option>Mixed</option>
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          <option>Scheduled</option><option>Played</option>
        </select>
      </div>
      <div className="card">
        {filtered.length === 0
          ? <div className="empty">No fixtures found.</div>
          : <table>
              <thead><tr>
                <th>Date</th><th>Type</th><th>Match</th><th>Score</th><th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(f => {
                  const p1a = playerMap[f.p1a], p1b = playerMap[f.p1b]
                  const p2a = playerMap[f.p2a], p2b = playerMap[f.p2b]
                  const t1 = teamLabel(p1a, p1b), t2 = teamLabel(p2a, p2b)
                  const win = setWinner(f.sets)
                  const d = new Date(f.match_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  return (
                    <tr key={f.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{d}</td>
                      <td><span className={`badge badge-${f.match_type.toLowerCase()}`}>{f.match_type}</span></td>
                      <td>
                        <span style={{ fontWeight: win === 'team1' ? 600 : 400 }}>{t1}</span>
                        <span className="vs">vs</span>
                        <span style={{ fontWeight: win === 'team2' ? 600 : 400 }}>{t2}</span>
                        {f.venue && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{f.venue}</div>}
                      </td>
                      <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                        {f.sets && f.sets.length > 0
                          ? f.sets.map((s, i) => <span key={i} style={{ marginRight: 6 }}>{s.p1}–{s.p2}</span>)
                          : '—'}
                      </td>
                      <td><span className={`badge badge-${f.status.toLowerCase()}`}>{f.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        }
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
        Share this page URL with the group — they can see all fixtures and results here.
      </p>
    </>
  )
}

// ─── Score Modal ─────────────────────────────────────────────
function ScoreModal({ fixture, players, onSave, onClose }) {
  const [sets, setSets] = useState([{ p1: '', p2: '' }])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const t1 = teamLabel(playerMap[fixture.p1a], playerMap[fixture.p1b])
  const t2 = teamLabel(playerMap[fixture.p2a], playerMap[fixture.p2b])

  const updateSet = (i, side, val) => {
    const next = [...sets]
    next[i] = { ...next[i], [side]: val }
    setSets(next)
  }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      // Delete old results for this fixture
      await supabase.from('results').delete().eq('fixture_id', fixture.id)
      // Insert new sets
      const rows = sets.map((s, i) => ({
        fixture_id: fixture.id,
        set_number: i + 1,
        score_p1: parseInt(s.p1) || 0,
        score_p2: parseInt(s.p2) || 0
      }))
      const { error: rErr } = await supabase.from('results').insert(rows)
      if (rErr) throw rErr
      // Update fixture status
      const { error: fErr } = await supabase.from('fixtures').update({ status: 'Played' }).eq('id', fixture.id)
      if (fErr) throw fErr
      onSave()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ marginBottom: 8 }}>Enter match result</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          <strong>{t1}</strong> vs <strong>{t2}</strong> · {fixture.match_type}
        </p>
        {err && <Alert msg={err} type="error" />}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 32px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Set</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{t1.split(' ')[0]}</div>
          <div></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{t2.split(' ')[0]}</div>
        </div>
        {sets.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 32px 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Set {i + 1}</span>
            <input type="number" min="0" max="25" value={s.p1} onChange={e => updateSet(i, 'p1', e.target.value)} style={{ textAlign: 'center' }} />
            <span style={{ textAlign: 'center', color: 'var(--muted)' }}>–</span>
            <input type="number" min="0" max="25" value={s.p2} onChange={e => updateSet(i, 'p2', e.target.value)} style={{ textAlign: 'center' }} />
            {sets.length > 1 && (
              <button className="btn btn-sm" onClick={() => setSets(sets.filter((_, j) => j !== i))} style={{ padding: '4px 8px' }}>×</button>
            )}
          </div>
        ))}
        <button className="btn btn-sm" onClick={() => setSets([...sets, { p1: '', p2: '' }])} style={{ marginTop: 4 }}>+ Add set</button>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner"></span> : 'Save result'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Record Tab ──────────────────────────────────────────────
function RecordTab({ fixtures, players, onRefresh }) {
  const [type, setType] = useState('Singles')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [venue, setVenue] = useState('')
  const [p1a, setP1a] = useState('')
  const [p1b, setP1b] = useState('')
  const [p2a, setP2a] = useState('')
  const [p2b, setP2b] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [scoreFixture, setScoreFixture] = useState(null)

  const opts = players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)

  const addFixture = async () => {
    if (!date || !p1a || !p2a) { setMsg({ text: 'Please fill in date and players.', type: 'error' }); return }
    if (p1a === p2a) { setMsg({ text: 'Team 1 and Team 2 cannot have the same player.', type: 'error' }); return }
    setSaving(true); setMsg(null)
    const row = {
      match_type: type, match_date: date, venue: venue || null, status: 'Scheduled',
      p1a, p1b: type !== 'Singles' ? p1b : null,
      p2a, p2b: type !== 'Singles' ? p2b : null
    }
    const { error } = await supabase.from('fixtures').insert(row)
    setSaving(false)
    if (error) { setMsg({ text: error.message, type: 'error' }); return }
    setMsg({ text: 'Fixture added!', type: 'success' })
    onRefresh()
  }

  const pending = fixtures.filter(f => f.status === 'Scheduled').sort((a, b) => a.match_date > b.match_date ? 1 : -1)
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  return (
    <>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Schedule a fixture</h2>
        {msg && <Alert msg={msg.text} type={msg.type} />}
        <div className="form-row cols-2">
          <div className="form-group">
            <label>Match type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option>Singles</option><option>Doubles</option><option>Mixed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className={`form-row ${type === 'Singles' ? 'cols-2' : 'cols-2'}`}>
          <div className="form-group">
            <label>{type === 'Singles' ? 'Player 1' : 'Team 1 – Player A'}</label>
            <select value={p1a} onChange={e => setP1a(e.target.value)}><option value="">Select…</option>{opts}</select>
          </div>
          {type !== 'Singles' && (
            <div className="form-group">
              <label>Team 1 – Player B</label>
              <select value={p1b} onChange={e => setP1b(e.target.value)}><option value="">Select…</option>{opts}</select>
            </div>
          )}
          <div className="form-group">
            <label>{type === 'Singles' ? 'Player 2' : 'Team 2 – Player A'}</label>
            <select value={p2a} onChange={e => setP2a(e.target.value)}><option value="">Select…</option>{opts}</select>
          </div>
          {type !== 'Singles' && (
            <div className="form-group">
              <label>Team 2 – Player B</label>
              <select value={p2b} onChange={e => setP2b(e.target.value)}><option value="">Select…</option>{opts}</select>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Venue / court (optional)</label>
          <input type="text" placeholder="e.g. EK Sports Centre Court 2" value={venue} onChange={e => setVenue(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={addFixture} disabled={saving}>
          {saving ? <span className="spinner"></span> : 'Add fixture'}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Record result for scheduled fixture</h2>
        {pending.length === 0
          ? <div className="empty">No scheduled fixtures.</div>
          : <table>
              <thead><tr><th>Date</th><th>Type</th><th>Match</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map(f => {
                  const t1 = teamLabel(playerMap[f.p1a], playerMap[f.p1b])
                  const t2 = teamLabel(playerMap[f.p2a], playerMap[f.p2b])
                  const d = new Date(f.match_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  return (
                    <tr key={f.id}>
                      <td>{d}</td>
                      <td><span className={`badge badge-${f.match_type.toLowerCase()}`}>{f.match_type}</span></td>
                      <td>{t1} <span className="vs">vs</span> {t2}</td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => setScoreFixture(f)}>Enter score</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        }
      </div>

      {scoreFixture && (
        <ScoreModal
          fixture={scoreFixture}
          players={players}
          onSave={() => { setScoreFixture(null); onRefresh() }}
          onClose={() => setScoreFixture(null)}
        />
      )}
    </>
  )
}

// ─── Players Tab ─────────────────────────────────────────────
function PlayersTab({ players, onRefresh }) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [skill, setSkill] = useState('Intermediate')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const add = async () => {
    if (!first.trim() || !last.trim()) { setMsg({ text: 'Enter first and last name.', type: 'error' }); return }
    setSaving(true); setMsg(null)
    const { error } = await supabase.from('players').insert({ first_name: first.trim(), last_name: last.trim(), skill_level: skill })
    setSaving(false)
    if (error) { setMsg({ text: error.message, type: 'error' }); return }
    setFirst(''); setLast('')
    setMsg({ text: 'Player added!', type: 'success' })
    onRefresh()
  }

  const remove = async (id) => {
    if (!confirm('Remove this player?')) return
    await supabase.from('players').delete().eq('id', id)
    onRefresh()
  }

  return (
    <>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Add player</h2>
        {msg && <Alert msg={msg.text} type={msg.type} />}
        <div className="form-row cols-3">
          <div className="form-group">
            <label>First name</label>
            <input placeholder="e.g. Jamie" value={first} onChange={e => setFirst(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input placeholder="e.g. Campbell" value={last} onChange={e => setLast(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Skill level</label>
            <select value={skill} onChange={e => setSkill(e.target.value)}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={add} disabled={saving}>
          {saving ? <span className="spinner"></span> : 'Add player'}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Registered players ({players.length})</h2>
        {players.length === 0
          ? <div className="empty">No players yet. Add your members above.</div>
          : <table>
              <thead><tr><th>#</th><th>Name</th><th>Skill level</th><th>Action</th></tr></thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</td>
                    <td><span className="badge badge-scheduled">{p.skill_level}</span></td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </>
  )
}

// ─── Leaderboard Tab ─────────────────────────────────────────
function LeaderboardTab({ fixtures, players }) {
  const [typeF, setTypeF] = useState('')
  const medals = ['🥇', '🥈', '🥉']

  const played = fixtures.filter(f => f.status === 'Played' && (!typeF || f.match_type === typeF))
  const totals = Object.fromEntries(players.map(p => [p.id, { id: p.id, name: `${p.first_name} ${p.last_name}`, w: 0, l: 0, played: 0 }]))

  played.forEach(f => {
    const win = setWinner(f.sets)
    if (!win) return
    const winners = [win === 'team1' ? f.p1a : f.p2a, win === 'team1' ? f.p1b : f.p2b].filter(Boolean)
    const losers  = [win === 'team1' ? f.p2a : f.p1a, win === 'team1' ? f.p2b : f.p1b].filter(Boolean)
    winners.forEach(id => { if (totals[id]) { totals[id].w++; totals[id].played++ } })
    losers.forEach(id =>  { if (totals[id]) { totals[id].l++; totals[id].played++ } })
  })

  const sorted = Object.values(totals).filter(x => x.played > 0).sort((a, b) => b.w - a.w || (b.w / (b.played || 1)) - (a.w / (a.played || 1)))

  const allPlayed = fixtures.filter(f => f.status === 'Played').length
  const scheduled = fixtures.filter(f => f.status === 'Scheduled').length

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{fixtures.length}</div><div className="lbl">Total fixtures</div></div>
        <div className="stat-card"><div className="num">{allPlayed}</div><div className="lbl">Matches played</div></div>
        <div className="stat-card"><div className="num">{scheduled}</div><div className="lbl">Upcoming</div></div>
        <div className="stat-card"><div className="num">{players.length}</div><div className="lbl">Players</div></div>
      </div>

      <div className="filter-bar">
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          <option>Singles</option><option>Doubles</option><option>Mixed</option>
        </select>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Player standings</h2>
        {sorted.length === 0
          ? <div className="empty">No results yet.</div>
          : <table>
              <thead><tr><th>Rank</th><th>Player</th><th>Played</th><th>Won</th><th>Lost</th><th>Win %</th></tr></thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 16 }}>{medals[i] || i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.played}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{p.w}</td>
                    <td>{p.l}</td>
                    <td>{p.played > 0 ? Math.round(p.w / p.played * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </>
  )
}

// ─── Main App ────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState('fixtures')
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: pl }, { data: fx }, { data: rs }] = await Promise.all([
      supabase.from('players').select('*').order('last_name'),
      supabase.from('fixtures').select('*').order('match_date'),
      supabase.from('results').select('*').order('set_number')
    ])

    // Attach sets to fixtures
    const fxWithSets = (fx || []).map(f => ({
      ...f,
      sets: (rs || []).filter(r => r.fixture_id === f.id).map(r => ({ p1: r.score_p1, p2: r.score_p2 }))
    }))

    setPlayers(pl || [])
    setFixtures(fxWithSets)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const tabs = [
    { id: 'fixtures', label: 'Fixtures & Results' },
    { id: 'record', label: 'Record match' },
    { id: 'players', label: 'Players' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ]

  return (
    <>
      <Head>
        <title>EK Pickleball Championship</title>
        <meta name="description" content="East Kilbride Pickleball Group Championship — fixtures, results and leaderboard" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏓</text></svg>" />
      </Head>

      <Header />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.25rem 2rem' }}>
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading
          ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}><span className="spinner"></span></div>
          : tab === 'fixtures'    ? <FixturesTab fixtures={fixtures} players={players} />
          : tab === 'record'      ? <RecordTab fixtures={fixtures} players={players} onRefresh={fetchAll} />
          : tab === 'players'     ? <PlayersTab players={players} onRefresh={fetchAll} />
          : tab === 'leaderboard' ? <LeaderboardTab fixtures={fixtures} players={players} />
          : null
        }
      </main>
    </>
  )
}
