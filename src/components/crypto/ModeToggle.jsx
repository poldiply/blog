export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="cs-mode-toggle">
      <button
        className={`cs-mode-btn${mode === 'simple' ? ' active' : ''}`}
        onClick={() => onChange('simple')}
      >
        Simple
      </button>
      <button
        className={`cs-mode-btn${mode === 'cavp' ? ' active' : ''}`}
        onClick={() => onChange('cavp')}
      >
        CAVP
      </button>
    </div>
  );
}
