import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function UserProfile() {
  const { username } = useParams()
  const [challenges, setChallenges] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/api/challenges/')
      .then(r => r.json())
      .then(data => setChallenges(data.filter(c => c.creator === username)))
  }, [username])

  return (
    <div className="room" style={{ justifyContent: 'flex-start', paddingTop: '100px', overflowY: 'auto', minHeight: '100vh' }}>
      <div className="level-display">AGENT PROFILE</div>

      <div className="ui" style={{ maxWidth: '500px', width: '100%', marginBottom: '24px' }}>
        <div className="page-title" style={{ fontSize: '28px' }}>{username}</div>
        <div className="page-subtitle">ESCAPE ROOM CREATOR</div>
        <button onClick={() => navigate(-1)} style={{ marginTop: '8px' }}>BACK</button>
      </div>

      <div className="ui" style={{ maxWidth: '500px', width: '100%', marginBottom: '40px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', width: '100%', marginBottom: '12px' }}>
          CHALLENGES CREATED — {challenges.length}
        </div>

        {challenges.length === 0 && (
          <div className="message">No challenges created yet.</div>
        )}

        {challenges.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: '10px', width: '100%' }}>
            <div className="card-title">{c.title}</div>
            <div className="card-meta">{c.puzzles?.length || 0} puzzles</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => navigate(`/game/${c.id}`)}>PLAY</button>
              <button onClick={() => navigate(`/leaderboard/${c.id}`)}>LEADERBOARD</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}