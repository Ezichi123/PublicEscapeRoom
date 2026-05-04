import Inventory from './Inventory';

// Distribute N objects in a visually pleasing grid within the room
function getDefaultPosition(index, total) {
  const cols = Math.min(total, 3);
  const rows = Math.ceil(total / cols);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const itemsInRow = (row === rows - 1) ? (total - row * cols) : cols;
  const xSpacing = 65 / (itemsInRow + 1);
  const ySpacing = 55 / (rows + 1);
  return {
    left: `${17.5 + xSpacing * (col + 1)}%`,
    top: `${12 + ySpacing * (row + 1)}%`,
  };
}

export default function RoomScene({
  theme,
  puzzles,
  solvedPuzzleIds,
  collectedItems,
  onObjectClick,
  onDoorClick,
  timerDisplay,
  onQuit,
}) {
  const solvedOrders = puzzles
    .filter(p => solvedPuzzleIds.has(p.id))
    .map(p => p.order);

  const solvedCount = solvedPuzzleIds.size;
  const totalCount = puzzles.length;
  const allSolved = solvedCount === totalCount && totalCount > 0;

  function getPuzzleState(puzzle) {
    if (solvedPuzzleIds.has(puzzle.id)) return 'solved';
    if (puzzle.unlock_after_order != null) {
      if (!solvedOrders.includes(puzzle.unlock_after_order)) return 'locked';
    }
    return 'available';
  }

  function getLockMessage(puzzle) {
    if (puzzle.unlock_after_order == null) return '';
    const prereq = puzzles.find(p => p.order === puzzle.unlock_after_order);
    const name = prereq?.object_name || `Puzzle ${puzzle.unlock_after_order}`;
    return `🔒 Solve ${name} first`;
  }

  return (
    <div className={`room-scene theme-${theme || 'detective'}`}>
      <div className="room-walls" />
      <div className="room-mist" />

      {/* Top bar */}
      <div className="room-topbar">
        <div className="room-topbar-left">
          {timerDisplay}
        </div>
        <div className="room-topbar-right">
          <button className="room-hint-btn" onClick={() => {
            // Hint from room level — find first available unsolved puzzle
            const available = puzzles.find(p => getPuzzleState(p) === 'available');
            if (available) onObjectClick(available);
          }}>
            💡 Next Hint
          </button>
          <button className="room-quit-btn" onClick={onQuit}>✕ Quit</button>
        </div>
      </div>

      {/* Object hotspots */}
      {puzzles.map((puzzle, index) => {
        const state = getPuzzleState(puzzle);
        const pos = (puzzle.object_position?.x != null)
          ? { left: `${puzzle.object_position.x}%`, top: `${puzzle.object_position.y}%` }
          : getDefaultPosition(index, totalCount);

        return (
          <div
            key={puzzle.id}
            className={`object-hotspot ${state}`}
            style={pos}
            onClick={() => state !== 'locked' && onObjectClick(puzzle)}
            data-lock-msg={getLockMessage(puzzle)}
          >
            <div className="object-icon-wrap">
              {puzzle.object_icon || '❓'}
            </div>
            <span className="object-label">
              {puzzle.object_name || `Puzzle ${puzzle.order}`}
            </span>
          </div>
        );
      })}

      {/* Door */}
      <div
        className={`room-door${allSolved ? ' unlocked can-open' : ''}`}
        onClick={allSolved ? onDoorClick : undefined}
      >
        <div className="door-frame" />
        <div className="door-light" />
        <div className="door-panel">
          <div className="door-handle" />
        </div>
        {!allSolved && (
          <div className="door-locks">
            {puzzles.map((p, i) => (
              <span
                key={p.id}
                className={`door-lock-icon${solvedPuzzleIds.has(p.id) ? ' unlocked' : ''}`}
              >
                {solvedPuzzleIds.has(p.id) ? '🔓' : '🔒'}
              </span>
            ))}
          </div>
        )}
        <div className="door-progress">
          {allSolved ? '🚪 DOOR UNLOCKED — Click to escape!' : `${solvedCount}/${totalCount} solved`}
        </div>
      </div>

      {/* Floor */}
      <div className="room-floor" />

      {/* Inventory */}
      <Inventory items={collectedItems} />
    </div>
  );
}