import { PITCH_GUIDES, type PitchGuide } from '../domain/types';

/** On/off buttons for the reference lines on the pitch. */
export function GuideToggles({ active, onToggle }: { active: PitchGuide[]; onToggle: (guide: PitchGuide) => void }) {
  return (
    <div className="guide-toggles" role="group" aria-label="Hjälplinjer på planen">
      {PITCH_GUIDES.map((g) => (
        <button
          key={g.id}
          className={`guide-toggle ${active.includes(g.id) ? 'guide-toggle--on' : ''}`}
          aria-pressed={active.includes(g.id)}
          onClick={() => onToggle(g.id)}
        >
          <GuideIcon guide={g.id} />
          {g.label}
        </button>
      ))}
    </div>
  );
}

function GuideIcon({ guide }: { guide: PitchGuide }) {
  return (
    <svg viewBox="0 0 16 12" width="16" height="12" aria-hidden>
      <rect x="0.5" y="0.5" width="15" height="11" rx="1" fill="none" stroke="currentColor" />
      {guide === 'corridors' ? (
        <path d="M0.5 3h15M0.5 5h15M0.5 7h15M0.5 9h15" stroke="currentColor" strokeDasharray="1.5 1" strokeWidth="0.8" />
      ) : (
        <path d="M5.5 0.5v11M10.5 0.5v11" stroke="currentColor" strokeDasharray="1.5 1" strokeWidth="0.8" />
      )}
    </svg>
  );
}
