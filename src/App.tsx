import { useCallback, useMemo, useState } from 'react';
import { createScenario, duplicateScenario } from './domain/scenario';
import { sampleBuildUp } from './domain/samples';
import { buildUpSuggestions, SUGGESTION_PRINCIPLE } from './domain/suggestions';
import type { Scenario } from './domain/types';
import { unlinkPerson, type Person } from './domain/roster';
import { createLocalRosterStore } from './storage/rosterStore';
import { Squad } from './components/Squad';
import { createLocalStore, exportScenarios, findConflicts, parseImport, resolveImport } from './storage/scenarioStore';
import { Editor } from './components/Editor';
import { Library } from './components/Library';
import { Player } from './components/Player';

type View =
  | { name: 'library' }
  | { name: 'squad' }
  | { name: 'editor'; id: string }
  | { name: 'player'; id: string; from: 'library' | 'editor' };

const store = createLocalStore();
const rosterStore = createLocalRosterStore();

export function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => store.list());
  const [view, setView] = useState<View>({ name: 'library' });
  const [message, setMessage] = useState<string | null>(null);
  const [roster, setRoster] = useState<Person[]>(() => rosterStore.list());

  const refresh = useCallback(() => setScenarios(store.list()), []);

  const save = useCallback(
    (s: Scenario) => {
      store.save(s);
      refresh();
    },
    [refresh],
  );

  /** For library actions: report storage errors (e.g. full localStorage) instead of crashing. */
  const tryStore = (action: () => void): boolean => {
    try {
      action();
      return true;
    } catch {
      setMessage('Kunde inte spara – lagringen i webbläsaren är full eller blockerad. Exportera och ta bort gamla scenarier.');
      return false;
    } finally {
      refresh();
    }
  };

  const create = (s: Scenario) => {
    if (tryStore(() => store.save(s))) setView({ name: 'editor', id: s.id });
  };

  const exportFile = (list: Scenario[]) => {
    const blob = new Blob([exportScenarios(list)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = list.length === 1 ? `${slug(list[0]!.title)}.json` : `spelboken-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    try {
      const { scenarios: imported, skipped } = parseImport(await file.text());
      const existing = store.list();
      const conflicts = findConflicts(existing, imported);
      const replace =
        conflicts.length > 0 &&
        confirm(
          `${conflicts.length} av scenarierna finns redan här (${conflicts.map((s) => `"${s.title}"`).join(', ')}).\n\n` +
            'OK = ersätt dem med versionen i filen.\nAvbryt = behåll dina och importera filens som kopior.',
        );
      if (!tryStore(() => resolveImport(existing, imported, replace).forEach((s) => store.save(s)))) return;
      setMessage(
        `Importerade ${imported.length} scenario${imported.length === 1 ? '' : 'n'}` +
          (conflicts.length ? (replace ? `, ${conflicts.length} ersatte befintliga` : `, ${conflicts.length} som kopior`) : '') +
          (skipped ? `. ${skipped} kunde inte läsas.` : '.'),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Importen misslyckades.');
    }
  };

  /** Adds the generated suggestions that are not already in the library (matched by title). */
  const addSuggestions = () => {
    const titles = new Set(scenarios.map((s) => s.title));
    const fresh = buildUpSuggestions().filter((s) => !titles.has(s.title));
    if (!fresh.length) {
      setMessage(`Förslagen finns redan i biblioteket under "${SUGGESTION_PRINCIPLE}".`);
      return;
    }
    if (tryStore(() => fresh.forEach((s) => store.save(s))))
      setMessage(`Lade till ${fresh.length} förslag under "${SUGGESTION_PRINCIPLE}". Öppna och justera dem efter ert lag.`);
  };

  const principles = useMemo(
    () => [...new Set(scenarios.map((s) => s.principle.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'sv')),
    [scenarios],
  );

  const current = view.name === 'editor' || view.name === 'player' ? scenarios.find((s) => s.id === view.id) : undefined;

  if (view.name === 'editor' && current) {
    return (
      <Editor
        key={current.id}
        initial={current}
        principles={principles}
        onSave={save}
        onClose={() => setView({ name: 'library' })}
        // The editor saves before calling this.
        onPresent={(s) => setView({ name: 'player', id: s.id, from: 'editor' })}
        onExport={(s) => exportFile([s])}
        roster={roster}
      />
    );
  }

  if (view.name === 'squad') {
    return (
      <Squad
        roster={roster}
        onClose={() => setView({ name: 'library' })}
        onSave={(p) => {
          tryStore(() => rosterStore.save(p));
          setRoster(rosterStore.list());
        }}
        onRemove={(p) => {
          tryStore(() => {
            for (const s of store.list()) {
              const unlinked = unlinkPerson(s, p.id);
              if (unlinked !== s) store.save(unlinked);
            }
            rosterStore.remove(p.id);
          });
          setRoster(rosterStore.list());
        }}
      />
    );
  }

  if (view.name === 'player' && current) {
    return (
      <Player
        scenario={current}
        roster={roster}
        closeLabel={view.from === 'editor' ? 'Tillbaka till redigering' : 'Spelboken'}
        onClose={() => setView(view.from === 'editor' ? { name: 'editor', id: current.id } : { name: 'library' })}
      />
    );
  }

  return (
    <Library
      scenarios={scenarios}
      roster={roster}
      onOpenSquad={() => setView({ name: 'squad' })}
      message={message}
      onCreate={() => create(createScenario({ homeFormation: '4-3-3', awayFormation: '4-4-2' }))}
      onCreateSample={() => create(sampleBuildUp())}
      onAddSuggestions={addSuggestions}
      onOpen={(s) => setView({ name: 'editor', id: s.id })}
      onPresent={(s) => setView({ name: 'player', id: s.id, from: 'library' })}
      onDuplicate={(s) => tryStore(() => store.save(duplicateScenario(s)))}
      onDelete={(s) => {
        store.remove(s.id);
        refresh();
      }}
      onExport={exportFile}
      onImport={importFile}
    />
  );
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'scenario'
  );
}
