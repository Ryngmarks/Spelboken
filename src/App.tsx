import { useCallback, useMemo, useState } from 'react';
import { createScenario, duplicateScenario } from './domain/scenario';
import { sampleBuildUp } from './domain/samples';
import type { Scenario } from './domain/types';
import { createLocalStore, exportScenarios, parseImport } from './storage/scenarioStore';
import { Editor } from './components/Editor';
import { Library } from './components/Library';
import { Player } from './components/Player';

type View =
  | { name: 'library' }
  | { name: 'editor'; id: string }
  | { name: 'player'; id: string; from: 'library' | 'editor' };

const store = createLocalStore();

export function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => store.list());
  const [view, setView] = useState<View>({ name: 'library' });
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => setScenarios(store.list()), []);

  const save = useCallback(
    (s: Scenario) => {
      store.save(s);
      refresh();
    },
    [refresh],
  );

  const create = (s: Scenario) => {
    store.save(s);
    refresh();
    setView({ name: 'editor', id: s.id });
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
      const existing = new Set(store.list().map((s) => s.id));
      const updated = imported.filter((s) => existing.has(s.id)).length;
      imported.forEach((s) => store.save(s));
      refresh();
      setMessage(
        `Importerade ${imported.length} scenario${imported.length === 1 ? '' : 'n'}` +
          (updated ? `, varav ${updated} ersatte befintliga` : '') +
          (skipped ? `. ${skipped} kunde inte läsas.` : '.'),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Importen misslyckades.');
    }
  };

  const principles = useMemo(
    () => [...new Set(scenarios.map((s) => s.principle.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'sv')),
    [scenarios],
  );

  const current = view.name === 'library' ? undefined : scenarios.find((s) => s.id === view.id);

  if (view.name === 'editor' && current) {
    return (
      <Editor
        key={current.id}
        initial={current}
        principles={principles}
        onSave={save}
        onClose={() => setView({ name: 'library' })}
        onPresent={(s) => {
          save(s);
          setView({ name: 'player', id: s.id, from: 'editor' });
        }}
      />
    );
  }

  if (view.name === 'player' && current) {
    return (
      <Player
        scenario={current}
        closeLabel={view.from === 'editor' ? 'Tillbaka till redigering' : 'Spelboken'}
        onClose={() => setView(view.from === 'editor' ? { name: 'editor', id: current.id } : { name: 'library' })}
      />
    );
  }

  return (
    <Library
      scenarios={scenarios}
      message={message}
      onCreate={() => create(createScenario({ homeFormation: '4-3-3', awayFormation: '4-4-2' }))}
      onCreateSample={() => create(sampleBuildUp())}
      onOpen={(s) => setView({ name: 'editor', id: s.id })}
      onPresent={(s) => setView({ name: 'player', id: s.id, from: 'library' })}
      onDuplicate={(s) => {
        store.save(duplicateScenario(s));
        refresh();
      }}
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
