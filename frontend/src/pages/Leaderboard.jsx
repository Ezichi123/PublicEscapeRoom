import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function Leaderboard() {
  const { challengeId } = useParams()
  const [entries, setEntries] = useState([])
  const [challengeTitle, setChallengeTitle] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch(`/api/leaderboard/${challengeId}/`)
      .then(r => r.json())
      .then(data => setEntries(data))

    apiFetch(`/api/challenges/${challengeId}/`)
      .then(r => r.json())
      .then(data => setChallengeTitle(data.title))
  }, [challengeId])

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="room" style={{ justifyContent: 'flex-start', paddingTop: '100px', overflowY: 'auto', minHeight: '100vh' }}>
      <div className="level-display">LEADERBOARD</div>
      <div className="ui" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="page-title" style={{ fontSize: '24px' }}>{challengeTitle || 'CHALLENGE'}</div>
        <div className="page-subtitle">TOP TIMES</div>

        {entries.length === 0 && (
          <div className="message">No entries yet — be the first!</div>
        )}

        {entries.map((e, i) => (
          <div className="leaderboard-row" key={i} style={{ width: '100%' }}>
            <span className="rank">#{i + 1}</span>
            <span
              className="lb-name"
              onClick={() => navigate(`/user/${e.username}`)}
              style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}
            >
              {e.username}
            </span>
            <span className="lb-time">{formatTime(e.total_time_seconds)}</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              {e.attempts} attempts · {e.hints_used} hints
            </span>
          </div>
        ))}

        <button onClick={() => navigate('/challenges')} style={{ marginTop: '16px' }}>
          BACK TO CHALLENGES
        </button>
      </div>
    </div>
  )
}