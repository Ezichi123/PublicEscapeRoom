import { useState, useRef, useEffect } from 'react';

export default function PuzzleInput({ puzzle, answer, setAnswer }) {
  const comboRefs = useRef([]);

  // Auto-focus first combo digit when combo type selected
  useEffect(() => {
    if (puzzle.match_type === 'combination' && comboRefs.current[0]) {
      comboRefs.current[0].focus();
    }
  }, [puzzle.match_type]);

  switch (puzzle.match_type) {
    case 'multiple_choice':
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

    case 'combination': {
      const len = puzzle.combo_length || 4;
      const digits = answer.split('');
      return (
        <div className="combo-input">
          {Array.from({ length: len }).map((_, i) => (
            <input
              key={i}
              ref={el => comboRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="combo-digit"
              value={digits[i] || ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                const newDigits = [...digits];
                newDigits[i] = val;
                setAnswer(newDigits.join(''));
                if (val && comboRefs.current[i + 1]) {
                  comboRefs.current[i + 1].focus();
                }
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

    case 'image':
      return (
        <div className="image-puzzle">
          {puzzle.image_url && (
            <img src={puzzle.image_url} alt="puzzle" />
          )}
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

    default:
      return (
        <input
          type="text"
          className="puzzle-answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={
            puzzle.match_type === 'numeric'
              ? 'Enter a number...'
              : 'Type your answer...'
          }
          autoComplete="off"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.target.closest('.zoom-content')?.querySelector('.submit-answer-btn')?.click();
            }
          }}
        />
      );
  }
}