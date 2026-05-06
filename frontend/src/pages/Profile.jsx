import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [myChallenges, setMyChallenges] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/api/auth/profile/')
      .then(r => r.json())
      .then(data => setProfile(data))

    apiFetch('/api/challenges/mine/')
      .then(r => r.json())
      .then(data => setMyChallenges(data))
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    navigate('/')
  }

  if (!profile) return (
    <div className="room">
      <div className="ui">
        <div className="message">Loading...</div>
      </div>
    </div>
  )

  return (
    <div className="room" style={{ justifyContent: 'flex-start', paddingTop: '100px', overflowY: 'auto', minHeight: '100vh' }}>
      <div className="level-display">PROFILE</div>

      <div className="ui" style={{ maxWidth: '500px', width: '100%', marginBottom: '24px' }}>
        <div className="page-title" style={{ fontSize: '28px' }}>{profile.username}</div>
        <div className="page-subtitle">AGENT PROFILE</div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', width: '100%' }}>
          <button onClick={() => navigate('/challenges')} style={{ flex: 1 }}>BACK</button>
          <button className="danger" onClick={logout} style={{ flex: 1 }}>LOG OUT</button>
        </div>
      </div>

      <div className="ui" style={{ maxWidth: '500px', width: '100%', marginBottom: '40px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', width: '100%', marginBottom: '12px' }}>
          MY CHALLENGES — {myChallenges.length}
        </div>

        {myChallenges.length === 0 && (
          <div className="message">No challenges created yet.</div>
        )}

        {myChallenges.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: '10px', width: '100%' }}>
            <div className="card-title">{c.title}</div>
            <div className="card-meta">{c.puzzles?.length || 0} puzzles</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => navigate(`/game/${c.id}`)}>PLAY</button>
              <button onClick={() => navigate(`/leaderboard/${c.id}`)}>LEADERBOARD</button>
            </div>
          </div>
        ))}

        <button className="primary" onClick={() => navigate('/builder')} style={{ width: '100%', marginTop: '8px' }}>
          + CREATE NEW CHALLENGE
        </button>
      </div>
    </div>
  )
}