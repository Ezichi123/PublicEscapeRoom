import PuzzleInput from './PuzzleInput';

export default function ZoomView({
  puzzle,
  theme,
  isSolved,
  answer,
  setAnswer,
  feedback,
  hint,
  onClose,
  onSubmit,
  onHint,
  onReveal,
}) {
  return (
    <div className="zoom-overlay" onClick={onClose}>
      <div className="zoom-content" onClick={e => e.stopPropagation()}>
        <button className="zoom-back" onClick={onClose}>
          ← Back to Room
        </button>

        <div className="zoom-object">
          <span className="zoom-object-icon">
            {puzzle.object_icon || '❓'}
          </span>
          <div className="zoom-object-name">
            {puzzle.object_name || `Puzzle ${puzzle.order}`}
          </div>
          {isSolved && <div className="zoom-solved-badge">✓ SOLVED</div>}
        </div>

        <div className="zoom-puzzle">
          {puzzle.flavor_text && (
            <p style={{
              color: 'var(--text-dim)',
              fontStyle: 'italic',
              marginBottom: '12px',
              fontSize: '14px',
            }}>
              {puzzle.flavor_text}
            </p>
          )}

          <p style={{
            color: 'var(--text)',
            fontSize: '16px',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}>
            {puzzle.question}
          </p>

          {!isSolved ? (
            <>
              <PuzzleInput
                puzzle={puzzle}
                answer={answer}
                setAnswer={setAnswer}
              />

              {feedback && (
                <p style={{
                  marginTop: '10px',
                  fontSize: '14px',
                  fontFamily: "'Share Tech Mono', monospace",
                  color: feedback.correct ? 'var(--success)' : 'var(--danger)',
                }}>
                  {feedback.correct ? '✓ Correct!' : '✗ ' + (feedback.message || 'Try again')}
                </p>
              )}

              <div className="puzzle-actions">
                <button
                  className="submit-answer-btn"
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    fontWeight: 700,
                  }}
                  onClick={onSubmit}
                >
                  Submit
                </button>
                <button
                  onClick={onHint}
                  style={{
                    background: 'rgba(255,201,74,0.1)',
                    border: '1px solid rgba(255,201,74,0.3)',
                    color: 'var(--gold)',
                  }}
                >
                  💡 Hint
                </button>
                <button
                  onClick={onReveal}
                  style={{
                    background: 'rgba(255,45,85,0.1)',
                    border: '1px solid rgba(255,45,85,0.3)',
                    color: 'var(--danger)',
                  }}
                >
                  Reveal
                </button>
              </div>

              {hint && (
                <div className="hint-box">
                  💡 {hint}
                </div>
              )}
            </>
          ) : (
            <p style={{
              marginTop: '12px',
              color: 'var(--success)',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '14px',
            }}>
              You've already solved this puzzle. Go back to the room!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}