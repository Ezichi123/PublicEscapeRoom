import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/api/challenges/')
      .then(r => r.json())
      .then(data => setChallenges(Array.isArray(data) ? data : []))
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

        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '3px', marginBottom: '12px' }}>
          ALL CHALLENGES
        </div>

        {challenges.length === 0 && (
          <div className="message" style={{ marginTop: '24px' }}>No challenges yet — create one!</div>
        )}

        {challenges.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: '12px' }}>
            <div className="card-title">{c.title}</div>
            <div className="card-meta">
              {c.puzzles?.length || 0} puzzles
              {c.timed_mode ? ` · ⏱ Timed` : ''}
            </div>
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