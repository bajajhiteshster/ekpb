import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

// ─── Helpers ────────────────────────────────────────────────
const pName = (p) => p ? `${p.first_name} ${p.last_name}` : '?'
const teamLabel = (pa, pb) => pb ? `${pName(pa)} / ${pName(pb)}` : pName(pa)

const MATCH_TYPES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
  "Hybrid",
  "Men's Doubles Intermediate",
  "Women's Doubles Intermediate",
  "Mixed Doubles Intermediate",
]

const DOUBLES_TYPES = [
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
  "Hybrid",
  "Men's Doubles Intermediate",
  "Women's Doubles Intermediate",
  "Mixed Doubles Intermediate",
]
const IS_DOUBLES = (t) => DOUBLES_TYPES.includes(t)
const typeToBadge = (t) => t.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')

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

// ─── Set Password Modal ───────────────────────────────────────
function SetPasswordModal({ onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return }
    if (pw !== pw2) { setErr('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) { setErr(error.message); return }
    onDone()
  }

  return (
    <div className="modal-bg">
      <div className="modal">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 20, margin: '0 auto 12px'
          }}>EK</div>
          <h2 style={{ fontSize: 17 }}>Set your admin password</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Welcome to EK Pickleball Championship admin.</p>
        </div>
        {err && <Alert msg={err} type="error" />}
        <div className="form-group">
          <label>New password</label>
          <input type="password" placeholder="At least 8 characters" value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Confirm password</label>
          <input type="password" placeholder="Repeat password" value={pw2} onChange={e => setPw2(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={save} disabled={saving}>
          {saving ? <span className="spinner"></span> : 'Set password & continue'}
        </button>
      </div>
    </div>
  )
}

// ─── Login Modal ─────────────────────────────────────────────
function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const login = async () => {
    if (!email || !pw) { setErr('Enter your email and password.'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setSaving(false)
    if (error) { setErr('Incorrect email or password.'); return }
    onLogin()
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 20, margin: '0 auto 12px'
          }}>EK</div>
          <h2 style={{ fontSize: 17 }}>Admin sign in</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>East Kilbride Pickleball Championship</p>
        </div>
        {err && <Alert msg={err} type="error" />}
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={login} disabled={saving}>
          {saving ? <span className="spinner"></span> : 'Sign in'}
        </button>
        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={onClose}>
          Cancel — view as public
        </button>
      </div>
    </div>
  )
}

// ─── Header ─────────────────────────────────────────────────
function Header({ user, onLoginClick, onLogout }) {
  return (
    <header style={{ background: '#fff', borderBottom: '0.5px solid var(--border)', padding: '0 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: 15, flexShrink: 0
        }}>EK</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18 }}>East Kilbride Pickleball Championship</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Fixtures, results &amp; leaderboard</p>
        </div>
        <div style={{ flexShrink: 0 }}>
          {user
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', marginRight: 5 }}></span>
                  Admin
                </span>
                <button className="btn btn-sm" onClick={onLogout}>Sign out</button>
              </div>
            : <button className="btn btn-sm" onClick={onLoginClick}>Admin sign in</button>
          }
        </div>
      </div>
    </header>
  )
}

// ─── Fixtures Tab ────────────────────────────────────────────
function FixturesTab({ fixtures, players, teams }) {
  const [typeF, setTypeF] = useState('')
  const [statusF, setStatusF] = useState('')
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const teamMap   = Object.fromEntries(teams.map(t => [t.id, t]))

  const getMatchLabel = (f) => {
    if (f.team1_id && f.team2_id) {
      const t1 = teamMap[f.team1_id], t2 = teamMap[f.team2_id]
      return {
        t1: t1 ? t1.team_name : '?',
        t2: t2 ? t2.team_name : '?',
        sub1: t1 ? teamLabel(playerMap[t1.player_a], playerMap[t1.player_b]) : '',
        sub2: t2 ? teamLabel(playerMap[t2.player_a], playerMap[t2.player_b]) : '',
      }
    }
    return {
      t1: teamLabel(playerMap[f.p1a], playerMap[f.p1b]),
      t2: teamLabel(playerMap[f.p2a], playerMap[f.p2b]),
      sub1: null, sub2: null,
    }
  }

  const filtered = fixtures
    .filter(f => (!typeF || f.match_type === typeF) && (!statusF || f.status === statusF))
    .sort((a, b) => a.match_date > b.match_date ? 1 : -1)

  return (
    <>
      <div className="filter-bar">
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          {MATCH_TYPES.map(t => <option key={t}>{t}</option>)}
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
              <thead><tr><th>Date</th><th>Type</th><th>Match</th><th>Score</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(f => {
                  const { t1, t2, sub1, sub2 } = getMatchLabel(f)
                  const win = setWinner(f.sets)
                  const d = new Date(f.match_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  return (
                    <tr key={f.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{d}</td>
                      <td><span className={`badge badge-${typeToBadge(f.match_type)}`}>{f.match_type}</span></td>
                      <td>
                        <div>
                          <span style={{ fontWeight: win === 'team1' ? 600 : 400 }}>{t1}</span>
                          <span className="vs">vs</span>
                          <span style={{ fontWeight: win === 'team2' ? 600 : 400 }}>{t2}</span>
                        </div>
                        {sub1 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub1} vs {sub2}</div>}
                        {f.venue && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{f.venue}</div>}
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
function ScoreModal({ fixture, players, teams, onSave, onClose }) {
  const [sets, setSets] = useState([{ p1: '', p2: '' }])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const teamMap   = Object.fromEntries(teams.map(t => [t.id, t]))

  const label1 = fixture.team1_id ? (teamMap[fixture.team1_id]?.team_name || '?') : teamLabel(playerMap[fixture.p1a], playerMap[fixture.p1b])
  const label2 = fixture.team2_id ? (teamMap[fixture.team2_id]?.team_name || '?') : teamLabel(playerMap[fixture.p2a], playerMap[fixture.p2b])

  const updateSet = (i, side, val) => {
    const next = [...sets]; next[i] = { ...next[i], [side]: val }; setSets(next)
  }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      await supabase.from('results').delete().eq('fixture_id', fixture.id)
      const rows = sets.map((s, i) => ({
        fixture_id: fixture.id, set_number: i + 1,
        score_p1: parseInt(s.p1) || 0, score_p2: parseInt(s.p2) || 0
      }))
      const { error: rErr } = await supabase.from('results').insert(rows)
      if (rErr) throw rErr
      const { error: fErr } = await supabase.from('fixtures').update({ status: 'Played' }).eq('id', fixture.id)
      if (fErr) throw fErr
      onSave()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ marginBottom: 8 }}>Enter match result</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          <strong>{label1}</strong> vs <strong>{label2}</strong> · {fixture.match_type}
        </p>
        {err && <Alert msg={err} type="error" />}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 32px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Set</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{label1.split(' ')[0]}</div>
          <div></div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{label2.split(' ')[0]}</div>
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

// ─── Teams Tab (public view, admin controls) ──────────────────
function TeamsTab({ teams, players, onRefresh, user }) {
  const [teamName, setTeamName] = useState('')
  const [matchType, setMatchType] = useState("Men's Doubles")
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const opts = players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)

  const add = async () => {
    if (!teamName.trim()) { setMsg({ text: 'Enter a team name.', type: 'error' }); return }
    if (!playerA || !playerB) { setMsg({ text: 'Select both players.', type: 'error' }); return }
    if (playerA === playerB) { setMsg({ text: 'Players must be different.', type: 'error' }); return }
    setSaving(true); setMsg(null)
    const { error } = await supabase.from('teams').insert({
      team_name: teamName.trim(), match_type: matchType,
      player_a: playerA, player_b: playerB
    })
    setSaving(false)
    if (error) { setMsg({ text: error.message, type: 'error' }); return }
    setTeamName(''); setPlayerA(''); setPlayerB('')
    setMsg({ text: 'Team registered!', type: 'success' })
    onRefresh()
  }

  const remove = async (id) => {
    if (!confirm('Remove this team?')) return
    await supabase.from('teams').delete().eq('id', id)
    onRefresh()
  }

  // Group teams by match type for display
  const grouped = DOUBLES_TYPES.reduce((acc, type) => {
    acc[type] = teams.filter(t => t.match_type === type)
    return acc
  }, {})

  return (
    <>
      {user && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Register a team</h2>
          {msg && <Alert msg={msg.text} type={msg.type} />}
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Team name</label>
              <input placeholder="e.g. The Smashers" value={teamName} onChange={e => setTeamName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={matchType} onChange={e => setMatchType(e.target.value)}>
                {DOUBLES_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Player A</label>
              <select value={playerA} onChange={e => setPlayerA(e.target.value)}>
                <option value="">Select…</option>{opts}
              </select>
            </div>
            <div className="form-group">
              <label>Player B</label>
              <select value={playerB} onChange={e => setPlayerB(e.target.value)}>
                <option value="">Select…</option>{opts}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={add} disabled={saving}>
            {saving ? <span className="spinner"></span> : 'Register team'}
          </button>
        </div>
      )}

      {/* Grouped team cards */}
      {DOUBLES_TYPES.map(type => {
        const typeTeams = grouped[type]
        if (typeTeams.length === 0) return null
        return (
          <div key={type} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{type}</h2>
              <span className={`badge badge-${typeToBadge(type)}`}>{typeTeams.length} team{typeTeams.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {typeTeams.map(t => (
                <div key={t.id} style={{
                  background: 'var(--gray-lt)', borderRadius: 8, padding: '12px 14px',
                  border: '0.5px solid var(--border)', position: 'relative'
                }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{t.team_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {pName(playerMap[t.player_a])} &amp; {pName(playerMap[t.player_b])}
                  </div>
                  {user && (
                    <button className="btn btn-sm btn-danger"
                      style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', fontSize: 11 }}
                      onClick={() => remove(t.id)}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {teams.length === 0 && (
        <div className="card">
          <div className="empty">
            {user ? 'No teams registered yet. Add teams above.' : 'No teams registered yet. Sign in as admin to add teams.'}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Record Tab (admin only) ──────────────────────────────────
function RecordTab({ fixtures, players, teams, onRefresh }) {
  const [type, setType] = useState("Men's Singles")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [venue, setVenue] = useState('')
  // Singles: p1a, p2a
  const [p1a, setP1a] = useState('')
  const [p2a, setP2a] = useState('')
  // Doubles: pick from registered teams
  const [team1Id, setTeam1Id] = useState('')
  const [team2Id, setTeam2Id] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [scoreFixture, setScoreFixture] = useState(null)

  const playerOpts = players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  // Teams filtered to current match type
  const eligibleTeams = teams.filter(t => t.match_type === type)
  const teamOpts = eligibleTeams.map(t => (
    <option key={t.id} value={t.id}>
      {t.team_name} ({pName(playerMap[t.player_a])} &amp; {pName(playerMap[t.player_b])})
    </option>
  ))

  // Reset team selection when type changes
  useEffect(() => { setTeam1Id(''); setTeam2Id(''); setP1a(''); setP2a('') }, [type])

  const addFixture = async () => {
    if (!date) { setMsg({ text: 'Please select a date.', type: 'error' }); return }

    if (IS_DOUBLES(type)) {
      if (!team1Id || !team2Id) { setMsg({ text: 'Please select both teams.', type: 'error' }); return }
      if (team1Id === team2Id) { setMsg({ text: 'Teams must be different.', type: 'error' }); return }
      if (eligibleTeams.length < 2) {
        setMsg({ text: `Register at least 2 ${type} teams in the Teams tab first.`, type: 'error' }); return
      }
      const t1 = teamMap[team1Id], t2 = teamMap[team2Id]
      setSaving(true); setMsg(null)
      const row = {
        match_type: type, match_date: date, venue: venue || null, status: 'Scheduled',
        team1_id: team1Id, team2_id: team2Id,
        p1a: t1.player_a, p1b: t1.player_b,
        p2a: t2.player_a, p2b: t2.player_b,
      }
      const { error } = await supabase.from('fixtures').insert(row)
      setSaving(false)
      if (error) { setMsg({ text: error.message, type: 'error' }); return }
    } else {
      if (!p1a || !p2a) { setMsg({ text: 'Please select both players.', type: 'error' }); return }
      if (p1a === p2a) { setMsg({ text: 'Players must be different.', type: 'error' }); return }
      setSaving(true); setMsg(null)
      const row = {
        match_type: type, match_date: date, venue: venue || null, status: 'Scheduled',
        p1a, p2a, p1b: null, p2b: null, team1_id: null, team2_id: null,
      }
      const { error } = await supabase.from('fixtures').insert(row)
      setSaving(false)
      if (error) { setMsg({ text: error.message, type: 'error' }); return }
    }

    setMsg({ text: 'Fixture added!', type: 'success' })
    setTeam1Id(''); setTeam2Id(''); setP1a(''); setP2a(''); setVenue('')
    onRefresh()
  }

  const getFixtureLabel = (f) => {
    if (f.team1_id && f.team2_id) {
      const t1 = teamMap[f.team1_id], t2 = teamMap[f.team2_id]
      return `${t1 ? t1.team_name : '?'} vs ${t2 ? t2.team_name : '?'}`
    }
    return `${teamLabel(playerMap[f.p1a], playerMap[f.p1b])} vs ${teamLabel(playerMap[f.p2a], playerMap[f.p2b])}`
  }

  const pending = fixtures.filter(f => f.status === 'Scheduled').sort((a, b) => a.match_date > b.match_date ? 1 : -1)

  return (
    <>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Schedule a fixture</h2>
        {msg && <Alert msg={msg.text} type={msg.type} />}
        <div className="form-row cols-2">
          <div className="form-group">
            <label>Match type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {MATCH_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {IS_DOUBLES(type) ? (
          <>
            {eligibleTeams.length < 2 && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>
                No {type} teams registered yet. Go to the <strong>Teams</strong> tab to register teams first.
              </div>
            )}
            <div className="form-row cols-2">
              <div className="form-group">
                <label>Team 1</label>
                <select value={team1Id} onChange={e => setTeam1Id(e.target.value)}>
                  <option value="">Select team…</option>{teamOpts}
                </select>
              </div>
              <div className="form-group">
                <label>Team 2</label>
                <select value={team2Id} onChange={e => setTeam2Id(e.target.value)}>
                  <option value="">Select team…</option>{teamOpts}
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Player 1</label>
              <select value={p1a} onChange={e => setP1a(e.target.value)}>
                <option value="">Select…</option>{playerOpts}
              </select>
            </div>
            <div className="form-group">
              <label>Player 2</label>
              <select value={p2a} onChange={e => setP2a(e.target.value)}>
                <option value="">Select…</option>{playerOpts}
              </select>
            </div>
          </div>
        )}

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
                  const d = new Date(f.match_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  return (
                    <tr key={f.id}>
                      <td>{d}</td>
                      <td><span className={`badge badge-${typeToBadge(f.match_type)}`}>{f.match_type}</span></td>
                      <td style={{ fontSize: 13 }}>{getFixtureLabel(f)}</td>
                      <td><button className="btn btn-sm btn-primary" onClick={() => setScoreFixture(f)}>Enter score</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        }
      </div>

      {scoreFixture && (
        <ScoreModal
          fixture={scoreFixture} players={players} teams={teams}
          onSave={() => { setScoreFixture(null); onRefresh() }}
          onClose={() => setScoreFixture(null)}
        />
      )}
    </>
  )
}

// ─── Players Tab (public view, admin controls) ────────────────
function PlayersTab({ players, onRefresh, user }) {
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
      {user && (
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
      )}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Registered players ({players.length})</h2>
          {!user && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sign in as admin to add or remove players</span>}
        </div>
        {players.length === 0
          ? <div className="empty">No players registered yet.</div>
          : <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Skill level</th>{user && <th>Action</th>}</tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</td>
                    <td><span className="badge badge-scheduled">{p.skill_level}</span></td>
                    {user && <td><button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}>Remove</button></td>}
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
function LeaderboardTab({ fixtures, players, teams }) {
  const [view, setView] = useState('players')  // 'players' | 'teams'
  const [typeF, setTypeF] = useState('')
  const medals = ['🥇', '🥈', '🥉']

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const teamMap   = Object.fromEntries(teams.map(t => [t.id, t]))

  // ── Player standings ──
  const playedFx = fixtures.filter(f => f.status === 'Played' && (!typeF || f.match_type === typeF))
  const playerTotals = Object.fromEntries(players.map(p => [p.id, { id: p.id, name: pName(p), w: 0, l: 0, played: 0 }]))

  playedFx.forEach(f => {
    const win = setWinner(f.sets)
    if (!win) return
    const winners = [win === 'team1' ? f.p1a : f.p2a, win === 'team1' ? f.p1b : f.p2b].filter(Boolean)
    const losers  = [win === 'team1' ? f.p2a : f.p1a, win === 'team1' ? f.p2b : f.p1b].filter(Boolean)
    winners.forEach(id => { if (playerTotals[id]) { playerTotals[id].w++; playerTotals[id].played++ } })
    losers.forEach(id =>  { if (playerTotals[id]) { playerTotals[id].l++; playerTotals[id].played++ } })
  })

  const sortedPlayers = Object.values(playerTotals).filter(x => x.played > 0)
    .sort((a, b) => b.w - a.w || (b.w / (b.played || 1)) - (a.w / (a.played || 1)))

  // ── Team standings ──
  const doublesPlayed = fixtures.filter(f =>
    f.status === 'Played' && IS_DOUBLES(f.match_type) &&
    f.team1_id && f.team2_id &&
    (!typeF || f.match_type === typeF)
  )

  const teamTotals = Object.fromEntries(teams.map(t => [t.id, {
    id: t.id,
    name: t.team_name,
    type: t.match_type,
    players: `${pName(playerMap[t.player_a])} & ${pName(playerMap[t.player_b])}`,
    w: 0, l: 0, played: 0
  }]))

  doublesPlayed.forEach(f => {
    const win = setWinner(f.sets)
    if (!win) return
    const winnerId = win === 'team1' ? f.team1_id : f.team2_id
    const loserId  = win === 'team1' ? f.team2_id : f.team1_id
    if (teamTotals[winnerId]) { teamTotals[winnerId].w++; teamTotals[winnerId].played++ }
    if (teamTotals[loserId])  { teamTotals[loserId].l++;  teamTotals[loserId].played++ }
  })

  const sortedTeams = Object.values(teamTotals).filter(x => x.played > 0)
    .sort((a, b) => b.w - a.w || (b.w / (b.played || 1)) - (a.w / (a.played || 1)))

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{fixtures.length}</div><div className="lbl">Total fixtures</div></div>
        <div className="stat-card"><div className="num">{fixtures.filter(f => f.status === 'Played').length}</div><div className="lbl">Matches played</div></div>
        <div className="stat-card"><div className="num">{fixtures.filter(f => f.status === 'Scheduled').length}</div><div className="lbl">Upcoming</div></div>
        <div className="stat-card"><div className="num">{players.length}</div><div className="lbl">Players</div></div>
        <div className="stat-card"><div className="num">{teams.length}</div><div className="lbl">Teams</div></div>
      </div>

      {/* View switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <button className={`tab${view === 'players' ? ' active' : ''}`} onClick={() => setView('players')}>Player standings</button>
        <button className={`tab${view === 'teams' ? ' active' : ''}`} onClick={() => setView('teams')}>Team standings</button>
      </div>

      <div className="filter-bar">
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All types</option>
          {(view === 'teams' ? DOUBLES_TYPES : MATCH_TYPES).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {view === 'players' ? (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Player standings</h2>
          {sortedPlayers.length === 0
            ? <div className="empty">No results recorded yet.</div>
            : <table>
                <thead><tr><th>Rank</th><th>Player</th><th>Played</th><th>Won</th><th>Lost</th><th>Win %</th></tr></thead>
                <tbody>
                  {sortedPlayers.map((p, i) => (
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
      ) : (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Team standings</h2>
          {sortedTeams.length === 0
            ? <div className="empty">No team results recorded yet.</div>
            : <table>
                <thead><tr><th>Rank</th><th>Team</th><th>Category</th><th>Players</th><th>Played</th><th>Won</th><th>Lost</th><th>Win %</th></tr></thead>
                <tbody>
                  {sortedTeams.map((t, i) => (
                    <tr key={t.id}>
                      <td style={{ fontSize: 16 }}>{medals[i] || i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td><span className={`badge badge-${typeToBadge(t.type)}`}>{t.type}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.players}</td>
                      <td>{t.played}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{t.w}</td>
                      <td>{t.l}</td>
                      <td>{t.played > 0 ? Math.round(t.w / t.played * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}
    </>
  )
}

// ─── Main App ────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [tab, setTab] = useState('fixtures')
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          if (hash.includes('type=invite') || hash.includes('type=recovery')) setNeedsPassword(true)
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: pl }, { data: fx }, { data: rs }, { data: tm }] = await Promise.all([
      supabase.from('players').select('*').order('last_name'),
      supabase.from('fixtures').select('*').order('match_date'),
      supabase.from('results').select('*').order('set_number'),
      supabase.from('teams').select('*').order('team_name'),
    ])
    const fxWithSets = (fx || []).map(f => ({
      ...f,
      sets: (rs || []).filter(r => r.fixture_id === f.id).map(r => ({ p1: r.score_p1, p2: r.score_p2 }))
    }))
    setPlayers(pl || [])
    setFixtures(fxWithSets)
    setTeams(tm || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (authReady) fetchAll() }, [authReady, fetchAll])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTab('fixtures')
  }

  const publicTabs = [
    { id: 'fixtures',    label: 'Fixtures & Results' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'teams',       label: 'Teams' },
    { id: 'players',     label: 'Players' },
  ]
  const adminTabs = [
    { id: 'record', label: 'Record match' },
  ]
  const tabs = user ? [...publicTabs, ...adminTabs] : publicTabs

  useEffect(() => {
    if (!user && tab === 'record') setTab('fixtures')
  }, [user, tab])

  if (!authReady) return null

  return (
    <>
      <Head>
        <title>EK Pickleball Championship</title>
        <meta name="description" content="East Kilbride Pickleball Group Championship — fixtures, results and leaderboard" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏓</text></svg>" />
      </Head>

      <Header user={user} onLoginClick={() => setShowLogin(true)} onLogout={logout} />

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
          : tab === 'fixtures'    ? <FixturesTab fixtures={fixtures} players={players} teams={teams} />
          : tab === 'leaderboard' ? <LeaderboardTab fixtures={fixtures} players={players} teams={teams} />
          : tab === 'teams'       ? <TeamsTab teams={teams} players={players} onRefresh={fetchAll} user={user} />
          : tab === 'players'     ? <PlayersTab players={players} onRefresh={fetchAll} user={user} />
          : tab === 'record'      ? <RecordTab fixtures={fixtures} players={players} teams={teams} onRefresh={fetchAll} />
          : null
        }
      </main>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={() => setShowLogin(false)} />
      )}
      {needsPassword && (
        <SetPasswordModal onDone={() => setNeedsPassword(false)} />
      )}
    </>
  )
}
