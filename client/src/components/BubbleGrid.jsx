import { LETTERS } from './ui.jsx';

// On-screen copy of the paper answer sheet. `answers[i]` is the chosen option index
// for question i + 1, or null when blank. Clicking the chosen bubble clears it.
export default function BubbleGrid({ answers, optionCount, onChange, disabled = false }) {
  const pick = (index, option) => {
    const next = [...answers];
    next[index] = next[index] === option ? null : option;
    onChange(next);
  };

  return (
    <div className="bubble-grid">
      {answers.map((selected, index) => (
        <div className="bubble-row" key={index} role="group" aria-label={`Question ${index + 1}`}>
          <b>{index + 1}</b>
          {LETTERS.slice(0, optionCount).map((letter, option) => (
            <button
              key={letter}
              type="button"
              className={`bubble ${selected === option ? 'selected' : ''}`}
              aria-pressed={selected === option}
              disabled={disabled}
              onClick={() => pick(index, option)}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
