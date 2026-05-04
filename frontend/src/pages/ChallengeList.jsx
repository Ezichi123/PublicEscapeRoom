import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([])
  const [featured, setFeatured] = useState([])
  const [daily, setDaily] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/api/challenges/')
      .then(r => r.json())
      .then(data => setChallenges(data))

    apiFetch('/api/challenges/featured/')
      .then(r => r.json())
      .then(data => setFeatured(data))

    apiFetch('/api/challenges/daily/')
      .then(r => r.json())
      .then(data => { if (data.id) setDaily(data) })
      .catch(() => {})
  }, [])

  return (
    <div className="room" style={{ justifyContent: 'flex-start', paddingTop: '100px', overflowY: 'auto', minHeight: '100vh' }}>
      <div className="level-display">ESCAPE ROOM</div>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => navigate('/builder')}>+ CREATE CHALLENGE</button>
          <button onClick={() => navigate('/my-challenges')}>MY CHALLENGES</button>
          <button onClick={() => navigate('/profile')}>PROFILE</button>
        </div>

        {/* DAILY CHALLENGE */}
        {daily && (
          <>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '3px', marginBottom: '12px' }}>
              ◈ DAILY CHALLENGE
            </div>
            <div className="card" style={{ marginBottom: '24px', borderLeft: '3px solid var(--gold)' }}
              onClick={() => navigate(`/game/${daily.id}`)}>
              <div className="badge">TODAY</div>
              <div className="card-title">{daily.title}</div>
              <div className="card-meta">{daily.puzzles?.length || 0} puzzles</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="primary" onClick={e => { e.stopPropagation(); navigate(`/game/${daily.id}`) }}>PLAY</button>
                <button onClick={e => { e.stopPropagation(); navigate(`/leaderboard/${daily.id}`) }}>LEADERBOARD</button>
              </div>
            </div>
          </>
        )}

        {/* FEATURED CHALLENGES */}
        {featured.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '12px' }}>
              ★ FEATURED
            </div>
            {featured.map(c => (
              <div key={c.id} className="card" style={{ marginBottom: '12px' }}>
                <div className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>FEATURED</div>
                <div className="card-title">{c.title}</div>
                <div className="card-meta">{c.puzzles?.length || 0} puzzles</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => navigate(`/game/${c.id}`)}>PLAY</button>
                  <button onClick={() => navigate(`/leaderboard/${c.id}`)}>LEADERBOARD</button>
                </div>
              </div>
            ))}
            <div style={{ marginBottom: '24px' }} />
          </>
        )}

        {/* ALL CHALLENGES */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '3px', marginBottom: '12px' }}>
          ALL CHALLENGES
        </div>
        {challenges.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: '12px' }}>
            <div className="card-title">{c.title}</div>
            <div className="card-meta">{c.puzzles?.length || 0} puzzles</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => navigate(`/game/${c.id}`)}>PLAY</button>
              <button onClick={() => navigate(`/leaderboard/${c.id}`)}>LEADERBOARD</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}