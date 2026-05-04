import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

const MATCH_TYPES = [
  { value: 'string', label: 'Exact Text Match' },
  { value: 'numeric', label: 'Numeric Match' },
  { value: 'regex', label: 'Pattern Match (Regex)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'combination', label: 'Combination Lock' },
  { value: 'image', label: 'Image Puzzle' },
]

const THEME_EMOJIS = {
  detective: ['📚', '🕯️', '🪞', '🖼️', '🗄️', '💀', '🗝️', '🐀', '🕰️', '🪦', '🔍', '📁', '📰', '📞', '🖋️', '📋'],
  haunted:  ['📚', '🕯️', '🪞', '🖼️', '🗄️', '💀', '🗝️', '🐀', '🕰️', '🪦', '🕷️', '🦇', '👻', '⚰️', '🧛', '🌙'],
  space:    ['🖥️', '🔭', '🔬', '💊', '🛸', '⚡', '🌑', '🔌', '📡', '🧪', '🤖', '💎', '🛰️', '☄️', '🌌', '🧲'],
  tomb:     ['🏺', '⚱️', '🗿', '🔮', '📜', '⚔️', '🛡️', '🐪', '🪷', '💎', '🐱', '🐍', '☀️', '🌙', '🪨', '🗝️'],
  pirate:   ['🗺️', '🧭', '⚓', '🏴‍☠️', '💰', '🪙', '🦜', '🔭', '🍺', '🗡️', '🗝️', '💣', '🪝', '🧶', '📦', '🌊'],
  lab:      ['🧪', '🔬', '🧬', '💉', '⚗️', '📋', '🖥️', '🔌', '🧫', '🧲', '💀', '🧠', '☢️', '💊', '🔑', '📂'],
}

const REWARD_EMOJIS = ['🔑', '🗝️', '🔦', '📜', '💎', '🪙', '🔮', '⚔️', '🛡️', '🧪', '📋', '🗺️', '💣', '💉', '🧲', '📦']

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(0,240,255,0.2)',
  color: 'var(--text)',
  fontFamily: 'var(--mono)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

function emptyPuzzle() {
  return {
    question: '',
    correct_answer: '',
    match_type: 'string',
    flavor_text: '',
    image_url: '',
    options: ['', '', '', ''],
    combo_digits: 4,
    hints: [],
    object_name: '',
    object_icon: '',
    reward_item: '',
    reward_icon: '',
    unlock_after_order: null,
  }
}

export default function Builder() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scene, setScene] = useState('')
  const [timedMode, setTimedMode] = useState(false)
  const [theme, setTheme] = useState('detective')
  const [puzzles, setPuzzles] = useState([emptyPuzzle()])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [saving, setSaving] = useState(false)

  function addPuzzle() {
    setPuzzles(prev => [...prev, emptyPuzzle()])
  }

  function removePuzzle(index) {
    setPuzzles(prev => prev.filter((_, i) => i !== index))
  }

  function updatePuzzle(index, field, value) {
    setPuzzles(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function updateOption(puzzleIndex, optionIndex, value) {
    setPuzzles(prev => prev.map((p, i) => {
      if (i !== puzzleIndex) return p
      const options = p.options.map((o, oi) => oi === optionIndex ? value : o)
      return { ...p, options }
    }))
  }

  function addHint(puzzleIndex) {
    setPuzzles(prev => prev.map((p, i) => {
      if (i !== puzzleIndex) return p
      return { ...p, hints: [...p.hints, { text: '', level: p.hints.length + 1 }] }
    }))
  }

  function updateHint(puzzleIndex, hintIndex, value) {
    setPuzzles(prev => prev.map((p, i) => {
      if (i !== puzzleIndex) return p
      const hints = p.hints.map((h, hi) => hi === hintIndex ? { ...h, text: value } : h)
      return { ...p, hints }
    }))
  }

  function removeHint(puzzleIndex, hintIndex) {
    setPuzzles(prev => prev.map((p, i) => {
      if (i !== puzzleIndex) return p
      return { ...p, hints: p.hints.filter((_, hi) => hi !== hintIndex) }
    }))
  }

  async function saveChallenge() {
    if (!title.trim()) {
      setMessage('Please enter a title')
      setMessageType('error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const res = await apiFetch('/api/challenges/create/', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          scene,
          timed_mode: timedMode,
          time_limit_seconds: 300,
          theme,
        })
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('Challenge create failed:', res.status, text)
        throw new Error(`Failed to create challenge (${res.status})`)
      }

      const challenge = await res.json()

      for (let i = 0; i < puzzles.length; i++) {
        const puzzle = puzzles[i]
        if (!puzzle.question.trim()) continue

        const correctAnswer = puzzle.match_type === 'combination'
          ? puzzle.correct_answer.slice(0, puzzle.combo_digits)
          : puzzle.correct_answer

        const puzzleRes = await apiFetch(`/api/challenges/${challenge.id}/puzzles/`, {
          method: 'POST',
          body: JSON.stringify({
            question: puzzle.question,
            correct_answer: correctAnswer,
            match_type: puzzle.match_type,
            flavor_text: puzzle.flavor_text,
            image_url: puzzle.match_type === 'image' ? puzzle.image_url : '',
            options: puzzle.match_type === 'multiple_choice'
              ? puzzle.options.filter(o => o.trim())
              : [],
            combo_length: puzzle.match_type === 'combination' ? puzzle.combo_digits : 4,
            flow_type: 'linear',
            order: i + 1,
            object_name: puzzle.object_name || '',
            object_icon: puzzle.object_icon || '',
            object_position: {},
            reward_item: puzzle.reward_item || '',
            reward_icon: puzzle.reward_icon || '',
            unlock_after_order: puzzle.unlock_after_order || null,
          })
        })

        if (!puzzleRes.ok) {
          const text = await puzzleRes.text()
          console.error(`Puzzle ${i + 1} create failed:`, puzzleRes.status, text)
          throw new Error(`Failed to save puzzle ${i + 1} (${puzzleRes.status})`)
        }

        const savedPuzzle = await puzzleRes.json()

        for (const hint of puzzle.hints) {
          if (!hint.text.trim()) continue
          const hintRes = await apiFetch(`/api/challenges/puzzles/${savedPuzzle.id}/hints/`, {
            method: 'POST',
            body: JSON.stringify({ text: hint.text, level: hint.level })
          })
          if (!hintRes.ok) {
            const text = await hintRes.text()
            console.error('Hint create failed:', hintRes.status, text)
          }
        }
      }

      setMessage('Challenge saved!')
      setMessageType('success')
      setTimeout(() => navigate('/challenges'), 1500)

    } catch (err) {
      setMessage(err.message || 'Something went wrong — check the console')
      setMessageType('error')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg-dark)', paddingTop: '80px', paddingBottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '4px', color: 'var(--accent)', marginBottom: '8px' }}>CHALLENGE BUILDER</div>

      <div className="ui" style={{ maxWidth: '600px', width: '90%', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', width: '100%' }}>CHALLENGE INFO</div>
        <input placeholder="Title..." value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%' }} />
        <textarea
          placeholder="Short description..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px', resize: 'vertical', minHeight: '60px', outline: 'none', boxSizing: 'border-box' }}
        />
        <textarea
          placeholder="Scene intro — sets the atmosphere before the player starts (e.g. 'You wake up in a locked library...')"
          value={scene}
          onChange={e => setScene(e.target.value)}
          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px', resize: 'vertical', minHeight: '80px', outline: 'none', boxSizing: 'border-box' }}
        />

        {/* Theme selector */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', marginBottom: '6px' }}>ROOM THEME</div>
          <select
            value={theme}
            onChange={e => setTheme(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          >
            <option value="detective">🕵️ Detective Office</option>
            <option value="haunted">👻 Haunted Mansion</option>
            <option value="space">🚀 Space Station</option>
            <option value="tomb">🏺 Egyptian Tomb</option>
            <option value="pirate">🏴‍☠️ Pirate Ship</option>
            <option value="lab">🧪 Secret Lab</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <input type="checkbox" id="timed" checked={timedMode} onChange={e => setTimedMode(e.target.checked)} style={{ width: 'auto' }} />
          <label htmlFor="timed" style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '2px' }}>TIMED MODE (5 min limit)</label>
        </div>
      </div>

      {puzzles.map((puzzle, pi) => (
        <div key={pi} className="ui" style={{ maxWidth: '600px', width: '90%', marginBottom: '16px', borderTopColor: 'rgba(255,201,74,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '3px' }}>PUZZLE {pi + 1}</span>
            {puzzles.length > 1 && (
              <button onClick={() => removePuzzle(pi)} style={{ padding: '4px 10px', fontSize: '10px', borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', cursor: 'pointer', fontFamily: 'var(--display)', letterSpacing: '1px' }}>REMOVE</button>
            )}
          </div>

          <select
            value={puzzle.match_type}
            onChange={e => updatePuzzle(pi, 'match_type', e.target.value)}
            style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px' }}
          >
            {MATCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <input
            placeholder="Atmospheric flavor text (optional — shown in italics above question)..."
            value={puzzle.flavor_text}
            onChange={e => updatePuzzle(pi, 'flavor_text', e.target.value)}
            style={{ width: '100%' }}
          />

          <input
            placeholder="Question or clue..."
            value={puzzle.question}
            onChange={e => updatePuzzle(pi, 'question', e.target.value)}
            style={{ width: '100%' }}
          />

          {puzzle.match_type === 'image' && (
            <>
              <input
                placeholder="Image URL..."
                value={puzzle.image_url}
                onChange={e => updatePuzzle(pi, 'image_url', e.target.value)}
                style={{ width: '100%' }}
              />
              {puzzle.image_url && (
                <img src={puzzle.image_url} alt="preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', border: '1px solid rgba(0,240,255,0.15)', marginTop: '4px' }} />
              )}
            </>
          )}

          {puzzle.match_type === 'multiple_choice' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px' }}>OPTIONS (correct answer must match one exactly)</div>
              {puzzle.options.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', width: '20px' }}>{String.fromCharCode(65 + oi)}</span>
                  <input
                    placeholder={`Option ${String.fromCharCode(65 + oi)}...`}
                    value={opt}
                    onChange={e => updateOption(pi, oi, e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}

          {puzzle.match_type === 'combination' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' }}>DIGITS:</span>
                {[3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => updatePuzzle(pi, 'combo_digits', n)}
                    style={{ padding: '6px 12px', background: puzzle.combo_digits === n ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${puzzle.combo_digits === n ? 'var(--accent)' : 'rgba(0,240,255,0.2)'}`, color: puzzle.combo_digits === n ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            placeholder={
              puzzle.match_type === 'multiple_choice' ? 'Correct answer (must match one option exactly)...' :
              puzzle.match_type === 'combination' ? `Correct code (${puzzle.combo_digits} digits, e.g. ${'0'.repeat(puzzle.combo_digits)})...` :
              puzzle.match_type === 'image' ? 'What should the player type after looking at the image...' :
              'Correct answer...'
            }
            value={puzzle.correct_answer}
            onChange={e => updatePuzzle(pi, 'correct_answer', e.target.value)}
            style={{ width: '100%' }}
          />

          {/* Room Object Settings */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '14px',
            marginTop: '14px',
          }}>
            <label style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px', display: 'block' }}>
              🏠 Room Object (optional — makes puzzle a clickable object in the room)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Object name (e.g. Old Bookshelf)"
                value={puzzle.object_name || ''}
                onChange={e => updatePuzzle(pi, 'object_name', e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="📚"
                value={puzzle.object_icon || ''}
                onChange={e => updatePuzzle(pi, 'object_icon', e.target.value)}
                style={{ ...inputStyle, textAlign: 'center', fontSize: '20px' }}
                maxLength={4}
              />
            </div>

            {/* Emoji quick-pick for objects */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
              {(THEME_EMOJIS[theme] || THEME_EMOJIS.detective).map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => updatePuzzle(pi, 'object_icon', emoji)}
                  style={{
                    background: puzzle.object_icon === emoji ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: puzzle.object_icon === emoji ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: 1,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Reward item */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Reward item name (e.g. Rusty Key)"
                value={puzzle.reward_item || ''}
                onChange={e => updatePuzzle(pi, 'reward_item', e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="🔑"
                value={puzzle.reward_icon || ''}
                onChange={e => updatePuzzle(pi, 'reward_icon', e.target.value)}
                style={{ ...inputStyle, textAlign: 'center', fontSize: '20px' }}
                maxLength={4}
              />
            </div>

            {/* Emoji quick-pick for rewards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
              {REWARD_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => updatePuzzle(pi, 'reward_icon', emoji)}
                  style={{
                    background: puzzle.reward_icon === emoji ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
                    border: puzzle.reward_icon === emoji ? '1px solid var(--success)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Unlock after */}
            <div style={{ marginBottom: '4px' }}>
              <select
                value={puzzle.unlock_after_order ?? ''}
                onChange={e => updatePuzzle(pi, 'unlock_after_order', e.target.value ? Number(e.target.value) : null)}
                style={inputStyle}
              >
                <option value="">Available from start</option>
                {puzzles.map((other, j) => (
                  j !== pi && (
                    <option key={j} value={j + 1}>
                      Unlock after: {other.object_name || `Puzzle ${j + 1}`}
                    </option>
                  )
                ))}
              </select>
            </div>
          </div>

          {/* Hints */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            {puzzle.hints.map((hint, hi) => (
              <div key={hi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--gold)', width: '48px', letterSpacing: '1px' }}>HINT {hi + 1}</span>
                <input
                  placeholder={`Hint ${hi + 1} — ${hi === 0 ? 'vague' : hi === 1 ? 'medium' : 'specific'}...`}
                  value={hint.text}
                  onChange={e => updateHint(pi, hi, e.target.value)}
                  style={{ flex: 1, borderColor: 'rgba(255,201,74,0.3)' }}
                />
                <button onClick={() => removeHint(pi, hi)} style={{ padding: '8px', background: 'transparent', border: '1px solid rgba(255,45,85,0.3)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '11px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => addHint(pi)} style={{ background: 'transparent', border: '1px dashed rgba(255,201,74,0.3)', color: 'var(--gold)', padding: '8px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', width: '100%' }}>
              + ADD HINT
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '12px', maxWidth: '600px', width: '90%', marginBottom: '16px' }}>
        <button onClick={addPuzzle} style={{ flex: 1 }}>+ ADD PUZZLE</button>
        <button className="primary" onClick={saveChallenge} disabled={saving} style={{ flex: 2 }}>
          {saving ? 'SAVING...' : 'SAVE CHALLENGE'}
        </button>
        <button onClick={() => navigate('/challenges')} style={{ flex: 1 }}>CANCEL</button>
      </div>

      {message && <div className={`message ${messageType}`} style={{ marginBottom: '40px' }}>{message}</div>}
    </div>
  )
}