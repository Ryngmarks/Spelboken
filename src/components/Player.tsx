import { useEffect, useState, useSyncExternalStore } from 'react';
import { phaseLabel, type PitchGuide, type Scenario } from '../domain/types';
import { GuideToggles } from './GuideToggles';
import { PitchView } from './PitchView';
import { pitchNames, type Person } from '../domain/roster';
import { usePlayback } from './usePlayback';

/** Player-facing presentation of a scenario: step through, play, read the explanation. */
export function Player({
  scenario,
  roster,
  onClose,
  closeLabel,
}: {
  scenario: Scenario;
  roster: Person[];
  onClose: () => void;
  closeLabel: string;
}) {
  const pb = usePlayback(scenario.frames);
  const frame = scenario.frames[pb.index]!;
  const count = scenario.frames.length;
  const portrait = useMediaQuery(PORTRAIT_QUERY);
  // Starts with what the coach chose; the viewer can toggle for themselves without changing the scenario.
  const [guides, setGuides] = useState<PitchGuide[]>(scenario.guides);
  const toggleGuide = (g: PitchGuide) => setGuides((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') pb.next();
      else if (e.key === 'ArrowLeft') pb.prev();
      else if (e.key === ' ') {
        e.preventDefault();
        if (pb.playing) pb.pause();
        else pb.play();
      } else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pb, onClose]);

  return (
    <div className="player">
      <header className="topbar">
        <button className="btn btn--ghost" onClick={onClose}>
          ← {closeLabel}
        </button>
        <div className="player__heading">
          <h1>{scenario.title}</h1>
          <p className="muted">
            {phaseLabel(scenario.phase)}
            {scenario.principle && ` · ${scenario.principle}`}
          </p>
        </div>
      </header>

      <main className="player__stage">
        <div className={`pitch-wrap pitch-wrap--player ${portrait ? 'pitch-wrap--portrait' : ''}`}>
          <PitchView
            orientation={portrait ? 'portrait' : 'landscape'}
            names={pitchNames(scenario, roster)}
            entities={scenario.entities}
            positions={pb.positions}
            drawings={frame.drawings}
            drawingOpacity={pb.drawingOpacity}
            guides={guides}
            label={`${scenario.title}, steg ${pb.index + 1} av ${count}`}
          />
        </div>

        <div className="player__controls">
          <button className="btn btn--round" onClick={pb.prev} disabled={pb.index === 0 && !pb.moving} aria-label="Föregående steg">
            ‹
          </button>
          <button
            className="btn btn--round btn--primary btn--play"
            onClick={pb.playing ? pb.pause : pb.play}
            aria-label={pb.playing ? 'Pausa' : 'Spela upp'}
            disabled={count < 2}
          >
            {pb.playing ? '❚❚' : '▶'}
          </button>
          <button className="btn btn--round" onClick={pb.next} disabled={pb.index >= count - 1 || pb.moving} aria-label="Nästa steg">
            ›
          </button>
        </div>

        <div className="dots" role="tablist" aria-label="Steg">
          {scenario.frames.map((f, i) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={i === pb.index}
              aria-label={`Steg ${i + 1}`}
              className={`dot ${i === pb.index ? 'dot--active' : ''} ${i < pb.index ? 'dot--done' : ''}`}
              onClick={() => pb.goTo(i)}
            />
          ))}
        </div>

        <section className="caption" aria-live="polite">
          <p className="caption__step">
            Steg {pb.index + 1} av {count}
          </p>
          <p className="caption__text">{frame.caption || <span className="muted">Ingen förklaring för det här steget.</span>}</p>
          {pb.index === 0 && scenario.description && <p className="caption__desc">{scenario.description}</p>}
        </section>

        <Legend />
        <GuideToggles active={guides} onToggle={toggleGuide} />
      </main>
    </div>
  );
}

/** Narrow, upright screens (phones held normally) get a vertical pitch. */
const PORTRAIT_QUERY = '(max-width: 700px) and (orientation: portrait)';

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => matchMedia(query).matches,
  );
}

function Legend() {
  return (
    <ul className="legend" aria-label="Teckenförklaring">
      <li>
        <span className="legend__swatch legend__swatch--home" /> Eget lag
      </li>
      <li>
        <span className="legend__swatch legend__swatch--away" /> Motståndare
      </li>
      <li>
        <span className="legend__line legend__line--run" /> Löpning
      </li>
      <li>
        <span className="legend__line legend__line--pass" /> Passning
      </li>
      <li>
        <span className="legend__line legend__line--dribble" /> Dribbling
      </li>
      <li>
        <span className="legend__line legend__line--press" /> Press
      </li>
    </ul>
  );
}
