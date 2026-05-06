import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const THEME_LABELS = {
  detective: 'Detective Office',
  haunted: 'Haunted Mansion',
  space: 'Space Station',
  tomb: 'Egyptian Tomb',
  pirate: 'Pirate Ship',
  lab: 'Secret Lab',
};

function PuzzleInput({ puzzle, answer, setAnswer }) {
  const comboRefs = useRef([]);

  useEffect(() => {
    if (puzzle.match_type === 'combination' && comboRefs.current[0]) {
      comboRefs.current[0].focus();
    }
  }, [puzzle.match_type]);

  if (puzzle.match_type === 'multiple_choice') {
    return (
      <div className="mc-options">
        {(puzzle.options || []).map((opt, i) => (
          <button
            key={i}
            type="button"
            className={`mc-option${answer === opt ? ' selected' : ''}`}
            onClick={() => setAnswer(opt)}
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>
    );
  }

  if (puzzle.match_type === 'combination') {
    const len = puzzle.combo_length || 4;
    const digits = (answer || '').split('');
    return (
      <div className="combo-input">
        {Array.from({ length: len }).map((_, i) => (
          <input
            key={i}
            ref={el => (comboRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="combo-digit"
            value={digits[i] || ''}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              const next = [...digits];
              next[i] = val;
              setAnswer(next.join(''));
              if (val && comboRefs.current[i + 1]) comboRefs.current[i + 1].focus();
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace' && !digits[i] && comboRefs.current[i - 1]) {
                comboRefs.current[i - 1].focus();
              }
            }}
          />
        ))}
      </div>
    );
  }

  if (puzzle.match_type === 'image') {
    return (
      <div className="image-puzzle">
        {puzzle.image_url && <img src={puzzle.image_url} alt="puzzle" />}
        <input
          type="text"
          className="puzzle-answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      className="puzzle-answer"
      value={answer}
      onChange={e => setAnswer(e.target.value)}
      placeholder={
        puzzle.match_type === 'regex' ? 'Enter Regex pattern (e.g. ^WORD$)...' :
        puzzle.match_type === 'numeric' ? 'Enter a number...' :
        'Type your answer...'
      }
      autoComplete="off"
      onKeyDown={e => {
        if (e.key === 'Enter') {
          const btn = e.target.closest('.zoom-puzzle')?.querySelector('.submit-answer-btn');
          if (btn) btn.click();
        }
      }}
    />
  );
}

function Inventory({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="inventory-bar">
      <span className="inventory-label">Collected</span>
      {items.map((item, i) => (
        <div key={i} className="inventory-item">
          <span className="inventory-item-icon">{item.icon}</span>
          <span className="inventory-item-name">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

function getDefaultPosition(index, total) {
  const cols = Math.min(total, 3);
  const rows = Math.ceil(total / cols);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const itemsInRow = row === rows - 1 ? total - row * cols : cols;
  const xSpacing = 65 / (itemsInRow + 1);
  const ySpacing = 50 / (rows + 1);
  return {
    left: `${17.5 + xSpacing * (col + 1)}%`,
    top: `${14 + ySpacing * (row + 1)}%`,
  };
}

function RoomScene({ theme, puzzles, solvedIds, collectedItems, onObjectClick, onDoorClick, timerDisplay, onQuit }) {
  const solvedOrders = puzzles.filter(p => solvedIds.includes(p.id)).map(p => p.order);
  const solvedCount = solvedIds.length;
  const totalCount = puzzles.length;
  const allSolved = solvedCount === totalCount && totalCount > 0;

  function getState(puzzle) {
    if (solvedIds.includes(puzzle.id)) return 'solved';
    if (puzzle.required_item) {
      const hasItem = collectedItems.some(item => item.name === puzzle.required_item);
      if (!hasItem) return 'locked_item';
    }
    if (puzzle.unlock_after_order != null && !solvedOrders.includes(puzzle.unlock_after_order)) return 'locked';
    return 'available';
  }

  function getLockMsg(puzzle) {
    if (puzzle.required_item) {
      const hasItem = collectedItems.some(item => item.name === puzzle.required_item);
      if (!hasItem) return `Find: ${puzzle.required_item}`;
    }
    if (puzzle.unlock_after_order == null) return '';
    const prereq = puzzles.find(p => p.order === puzzle.unlock_after_order);
    return `Solve ${prereq?.object_name || 'Puzzle ' + puzzle.unlock_after_order} first`;
  }

  return (
    <div className={`room-scene theme-${theme || 'detective'}`}>
      <div className="room-walls" />
      <div className="room-mist" />

      <div className="room-topbar">
        <div className="room-topbar-left">{timerDisplay}</div>
        <div className="room-topbar-right">
          <button className="room-hint-btn" onClick={() => {
            const avail = puzzles.find(p => getState(p) === 'available');
            if (avail) onObjectClick(avail);
          }}>💡 Hint</button>
          <button className="room-quit-btn" onClick={onQuit}>✕ Quit</button>
        </div>
      </div>

      {puzzles.map((puzzle, index) => {
        const state = getState(puzzle);
        const pos = puzzle.object_position?.x != null
          ? { left: `${puzzle.object_position.x}%`, top: `${puzzle.object_position.y}%` }
          : getDefaultPosition(index, totalCount);

        return (
          <div
            key={puzzle.id}
            className={`object-hotspot ${state}`}
            style={pos}
            onClick={() => state === 'available' && onObjectClick(puzzle)}
            data-lock-msg={getLockMsg(puzzle)}
          >
            <div className="object-icon-wrap">{puzzle.object_icon || '❓'}</div>
            <span className="object-label">{puzzle.object_name || 'Puzzle ' + puzzle.order}</span>
          </div>
        );
      })}

      <div className={`room-door${allSolved ? ' unlocked can-open' : ''}`} onClick={allSolved ? onDoorClick : undefined}>
        <div className="door-frame" />
        <div className="door-light" />
        <div className="door-panel"><div className="door-handle" /></div>
        {!allSolved && (
          <div className="door-locks">
            {puzzles.map(p => (
              <span key={p.id} className={`door-lock-icon${solvedIds.includes(p.id) ? ' unlocked' : ''}`}>
                {solvedIds.includes(p.id) ? '🔓' : '🔒'}
              </span>
            ))}
          </div>
        )}
        <div className="door-progress">
          {allSolved ? '🚪 DOOR UNLOCKED — Click to escape!' : `${solvedCount}/${totalCount} solved`}
        </div>
      </div>

      <div className="room-floor" />
      <Inventory items={collectedItems} />
    </div>
  );
}

function ZoomView({ puzzle, isSolved, answer, setAnswer, feedback, hint, onClose, onSubmit, onHint, onReveal }) {
  return (
    <div className="zoom-overlay" onClick={onClose}>
      <div className="zoom-content" onClick={e => e.stopPropagation()}>
        <button className="zoom-back" onClick={onClose}>← Back to Room</button>

        <div className="zoom-object">
          <span className="zoom-object-icon">{puzzle.object_icon || '❓'}</span>
          <div className="zoom-object-name">{puzzle.object_name || 'Puzzle ' + puzzle.order}</div>
          {isSolved && <div className="zoom-solved-badge">✓ SOLVED</div>}
        </div>

        <div className="zoom-puzzle">
          {puzzle.flavor_text && (
            <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '12px', fontSize: '14px' }}>
              {puzzle.flavor_text}
            </p>
          )}
          <p style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '16px', lineHeight: '1.5' }}>
            {puzzle.question}
          </p>

          {!isSolved ? (
            <>
              <PuzzleInput puzzle={puzzle} answer={answer} setAnswer={setAnswer} />

              {feedback && (
                <p style={{
                  marginTop: '10px', fontSize: '14px',
                  fontFamily: "'Share Tech Mono', monospace",
                  color: feedback.correct ? 'var(--success)' : 'var(--danger)',
                }}>
                  {feedback.correct ? '✓ Correct!' : '✗ ' + (feedback.message || 'Try again')}
                </p>
              )}

              <div className="puzzle-actions">
                <button className="submit-answer-btn" style={{ background: 'var(--accent)', color: '#000', fontWeight: 700 }} onClick={onSubmit}>
                  Submit
                </button>
                <button onClick={onHint} style={{ background: 'rgba(255,201,74,0.1)', border: '1px solid rgba(255,201,74,0.3)', color: 'var(--gold)' }}>
                  💡 Hint
                </button>
                <button onClick={onReveal} style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', color: 'var(--danger)' }}>
                  Reveal
                </button>
              </div>

              {hint && <div className="hint-box">💡 {hint}</div>}
            </>
          ) : (
            <p style={{ marginTop: '12px', color: 'var(--success)', fontFamily: "'Share Tech Mono', monospace", fontSize: '14px' }}>
              Already solved! Go back to the room.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  const { challengeId } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState(null);
  const [session, setSession] = useState(null);
  const [puzzles, setPuzzles] = useState([]);

  const [view, setView] = useState('loading');
  const [activePuzzle, setActivePuzzle] = useState(null);

  const [solvedIds, setSolvedIds] = useState([]);
  const [collectedItems, setCollectedItems] = useState([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hintsMap, setHintsMap] = useState({});

  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const gameActiveRef = useRef(false);
  const [puzzleHintCounts, setPuzzleHintCounts] = useState({});

  const [revealUsed, setRevealUsed] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbSubmitted, setLbSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/challenges/${challengeId}/`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setChallenge(data);
        const sorted = [...(data.puzzles || [])].sort((a, b) => a.order - b.order);
        setPuzzles(sorted);
        setView('intro');
      } catch (err) {
        console.error(err);
        alert('Could not load challenge.');
      }
    })();
  }, [challengeId]);

  // Timer — only starts once when game becomes active, doesn't restart on zoom
  useEffect(() => {
    if (view === 'room' || view === 'zoom') {
      if (!gameActiveRef.current) {
        gameActiveRef.current = true;
        timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      }
    } else {
      gameActiveRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [view]);

  useEffect(() => {
    if (challenge?.timed_mode && elapsed >= challenge.time_limit_seconds) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimedOut(true);
      setView('complete');
    }
  }, [elapsed, challenge]);

  const startGame = async () => {
    try {
      const res = await apiFetch(`/api/start-session/?challenge_id=${challengeId}`);
      if (!res.ok) throw new Error('Failed to start');
      const sess = await res.json();
      setSession(sess);
      setView('room');
    } catch (err) {
      alert('Could not start session: ' + err.message);
    }
  };

  const markSolved = useCallback((puzzleId) => {
    setSolvedIds(prev => prev.includes(puzzleId) ? prev : [...prev, puzzleId]);
  }, []);

  const handleObjectClick = useCallback((puzzle) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setActivePuzzle(puzzle);
    setAnswer('');
    setFeedback(null);
    setView('zoom');
  }, []);

  const handleSubmit = async () => {
    if (!answer.trim() || !activePuzzle || !session) return;
    try {
      const res = await apiFetch('/api/submit/', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session.session_id,
          puzzle_id: activePuzzle.id,
          answer: answer.trim(),
        }),
      });
      const result = await res.json();

      if (result.correct) {
        setFeedback({ correct: true });
        markSolved(activePuzzle.id);
        setTotalAttempts(p => p + (result.attempts || 1));

        if (activePuzzle.reward_item) {
          setCollectedItems(p => [
            ...p,
            { name: activePuzzle.reward_item, icon: activePuzzle.reward_icon || '📦' },
          ]);
        }

        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setView('room');
          setActivePuzzle(null);
          setAnswer('');
          setFeedback(null);
        }, 1200);
      } else {
        setFeedback({ correct: false, message: result.message || 'Try again' });
        setTotalAttempts(p => p + 1);
      }
    } catch (err) {
      setFeedback({ correct: false, message: 'Error submitting answer' });
    }
  };

const handleHint = async () => {
  if (!session || !activePuzzle) return;
  try {
    const hintsUsedForThisPuzzle = puzzleHintCounts[activePuzzle.id] || 0;
    const res = await apiFetch(
      `/api/hint/?session_id=${session.session_id}&puzzle_id=${activePuzzle.id}&hints_used=${hintsUsedForThisPuzzle}`
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.hint) {
      setHintsMap(prev => ({
        ...prev,
        [activePuzzle.id]: [...(prev[activePuzzle.id] || []), data.hint],
      }));
      setPuzzleHintCounts(prev => ({
        ...prev,
        [activePuzzle.id]: hintsUsedForThisPuzzle + 1,
      }));
      setTotalHintsUsed(p => p + 1);
    }
  } catch {}
};

  const handleReveal = async () => {
    if (!session || !activePuzzle) return;
    if (!window.confirm('Reveal the answer? This blocks leaderboard submission.')) return;
    try {
      const res = await apiFetch('/api/reveal/', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.session_id }),
      });
      const data = await res.json();
      setFeedback({ correct: false, message: 'Answer: ' + data.answer });
      setRevealUsed(true);
      markSolved(activePuzzle.id);

      if (activePuzzle.reward_item) {
        setCollectedItems(p => [
          ...p,
          { name: activePuzzle.reward_item, icon: activePuzzle.reward_icon || '📦' },
        ]);
      }

      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setView('room');
        setActivePuzzle(null);
        setAnswer('');
        setFeedback(null);
      }, 2500);
    } catch {
      alert('Error revealing answer');
    }
  };

  const handleDoorClick = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // 1. Tell the backend to officially end the session and save the time!
    if (session) {
      await apiFetch('/api/submit/', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session.session_id,
          answer: "__ESCAPED__"
        }),
      }).catch(() => {});
    }

    // 2. Switch to the complete screen
    setView('complete');
    
    // 3. Fetch the leaderboard
    apiFetch(`/api/leaderboard/${challengeId}/`)
      .then(r => r.json())
      .then(data => setLeaderboard(data || []))
      .catch(() => {});
  };

  const handleLbSubmit = async () => {
    if (!session || lbSubmitted) return;
    try {
      await apiFetch('/api/leaderboard/submit/', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.session_id }),
      });
      setLbSubmitted(true);
      const r = await apiFetch(`/api/leaderboard/${challengeId}/`);
      setLeaderboard(await r.json());
    } catch (err) {
      alert(err.message || 'Failed to submit');
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const currentHint = activePuzzle && hintsMap[activePuzzle.id]?.length
    ? hintsMap[activePuzzle.id][hintsMap[activePuzzle.id].length - 1] : null;

  const timerDisplay = challenge?.timed_mode ? (
    <div className={`timer${elapsed > challenge.time_limit_seconds * 0.8 ? ' warning' : ''}`}>
      ⏱ {fmt(Math.max(0, challenge.time_limit_seconds - elapsed))}
    </div>
  ) : (
    <div className="timer">⏱ {fmt(elapsed)}</div>
  );

  if (view === 'loading') {
    return <div className="ui" style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;
  }

  if (view === 'intro') {
    const t = challenge.theme || 'detective';
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
        <div className={`intro-scene theme-${t}`} style={{ width: '100%', maxWidth: '100%', height: '100%', minHeight: '100%', borderRadius: 0, border: 'none', boxShadow: 'none' }}>
          <div className="intro-theme-badge">{THEME_LABELS[t] || t}</div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--accent)' }}>{challenge.title}</h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '24px', maxWidth: '500px' }}>{challenge.description}</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <p style={{ color: 'var(--text)', fontSize: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>{challenge.scene}</p>
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '20px', fontFamily: "'Share Tech Mono', monospace" }}>
            {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''}
            {challenge.timed_mode && ` · ${fmt(challenge.time_limit_seconds)} time limit`}
          </div>
          <button className="btn" style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '12px 40px', fontSize: '16px' }} onClick={startGame}>BEGIN MISSION</button>
          <br />
          <button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginTop: '14px', fontSize: '13px' }} onClick={() => navigate('/challenges')}>← Back to challenges</button>
        </div>
      </div>
    );
  }

  if (view === 'complete') {
    const escaped = !timedOut && solvedIds.length === puzzles.length;
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
        <div className="completion">
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{escaped ? '🚪' : '⏱'}</div>
          <h1 className={escaped ? 'escaped-title' : ''} style={!escaped ? { color: 'var(--danger)' } : {}}>{escaped ? 'ESCAPED!' : "TIME'S UP"}</h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>{escaped ? 'You solved all the puzzles and escaped the room!' : `You solved ${solvedIds.length} of ${puzzles.length} puzzles.`}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', maxWidth: '400px', margin: '0 auto 28px' }}>
            {[{ v: fmt(elapsed), l: 'TIME' }, { v: totalAttempts, l: 'ATTEMPTS' }, { v: totalHintsUsed, l: 'HINTS' }].map(s => (
              <div key={s.l} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '24px', color: 'var(--accent)', fontFamily: "'Share Tech Mono', monospace" }}>{s.v}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{s.l}</div>
              </div>
            ))}
          </div>
          {escaped && !revealUsed && !lbSubmitted && (
            <button className="btn" style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, marginBottom: '16px' }} onClick={handleLbSubmit}>
              🏆 Submit to Leaderboard
            </button>
          )}
          {revealUsed && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>Answer revealed — leaderboard blocked</p>}
          {lbSubmitted && <p style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '16px' }}>✓ Submitted to leaderboard!</p>}
          {leaderboard.length > 0 && (
            <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '12px', fontSize: '16px' }}>🏆 Leaderboard</h3>
              <div className="leaderboard-row" style={{ opacity: 0.5, fontSize: '12px' }}><span>#</span><span>Player</span><span>Time</span><span>Attempts</span></div>
              {leaderboard.map((e, i) => (
                <div key={i} className="leaderboard-row">
                  <span>{i + 1}</span>
                  <span>{e.username}</span>
                  <span>{fmt(e.total_time_seconds)}</span>
                  <span>{e.attempts}</span>
                </div>
              ))}
            </div>
          )}
          <button className="btn" style={{ marginTop: '24px', background: 'rgba(255,255,255,0.06)' }} onClick={() => navigate('/challenges')}>← Back to Challenges</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', boxSizing: 'border-box' }}>
      <RoomScene
        theme={challenge?.theme}
        puzzles={puzzles}
        solvedIds={solvedIds}
        collectedItems={collectedItems}
        onObjectClick={handleObjectClick}
        onDoorClick={handleDoorClick}
        timerDisplay={timerDisplay}
        onQuit={() => navigate('/challenges')}
      />
      {view === 'zoom' && activePuzzle && (
        <ZoomView
          puzzle={activePuzzle}
          isSolved={solvedIds.includes(activePuzzle.id)}
          answer={answer}
          setAnswer={setAnswer}
          feedback={feedback}
          hint={currentHint}
          onClose={() => { setView('room'); setActivePuzzle(null); setAnswer(''); setFeedback(null); }}
          onSubmit={handleSubmit}
          onHint={handleHint}
          onReveal={handleReveal}
        />
      )}
    </div>
  );
}