import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type TestPanel = { id: string; name: string; tests: string[] };

/** Demo starter panels for the demo doctor only — real panels come from the doctor's account later. */
const starter: TestPanel[] = [
  { id: "p1", name: "Diabetes review", tests: ["FBS", "PPBS", "HbA1c", "Lipid Profile", "Creatinine"] },
  { id: "p2", name: "Hypertension workup", tests: ["KFT", "Serum Electrolytes", "Lipid Profile", "ECG", "Urine Routine"] },
  { id: "p3", name: "Fever workup", tests: ["CBC", "Dengue NS1", "Widal", "Urine Routine", "CRP"] },
];

const key = (doctorId: string) => `chikitra:doctor:${doctorId}:test-panels`;

export function useTestPanels(doctorId: string) {
  const [panels, setPanels] = useState<TestPanel[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key(doctorId));
      setPanels(raw ? JSON.parse(raw) : doctorId === "demo-doctor" ? starter : []);
    } catch { setPanels([]); }
    setLoaded(true);
  }, [doctorId]);
  useEffect(() => { if (loaded) window.localStorage.setItem(key(doctorId), JSON.stringify(panels)); }, [panels, loaded, doctorId]);
  return [panels, setPanels] as const;
}

export function SavedPanels({ doctorId, catalog, current, onAdd }: { doctorId: string; catalog: string[]; current: string[]; onAdd: (tests: string[]) => void }) {
  const [panels, setPanels] = useTestPanels(doctorId);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<TestPanel | null>(null);
  const has = (t: string) => current.some((c) => c.toLowerCase() === t.toLowerCase());

  function openNew() { setEditing({ id: `p${Date.now()}`, name: "", tests: [] }); setManageOpen(true); }
  function save(p: TestPanel) {
    setPanels((all) => (all.some((x) => x.id === p.id) ? all.map((x) => (x.id === p.id ? p : x)) : [...all, p]));
    setEditing(null);
  }

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved panels</span>
        {panels.length > 0 && <button type="button" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => { setEditing(null); setManageOpen(true); }}><Settings2 size={12} /> Manage</button>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Saved panels">
        {panels.map((p) => {
          const remaining = p.tests.filter((t) => !has(t)).length;
          return (
            <button key={p.id} type="button" disabled={p.tests.length === 0}
              title={p.tests.join(", ")}
              className="shrink-0 rounded-md border border-section-border bg-section-soft px-3 py-1.5 text-sm font-semibold text-section-ink hover:border-section-accent disabled:opacity-50"
              onClick={() => onAdd(p.tests)}>
              {p.name} <span className="ml-1 text-xs font-normal text-muted-foreground">{remaining === 0 && p.tests.length ? "added" : p.tests.length}</span>
            </button>
          );
        })}
        <button type="button" className="flex shrink-0 items-center gap-1 rounded-md border border-dashed border-section-border px-3 py-1.5 text-sm font-medium text-section-ink hover:bg-section-soft" onClick={openNew} aria-label="Create panel">
          <Plus size={14} />{panels.length === 0 && " Create panel"}
        </button>
      </div>

      <Sheet open={manageOpen} onOpenChange={(o) => { setManageOpen(o); if (!o) setEditing(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? (panels.some((p) => p.id === editing.id) ? "Edit panel" : "Create panel") : "Saved panels"}</SheetTitle>
            <SheetDescription>Your own shortcuts. Editing a panel never changes tests already added for this patient.</SheetDescription>
          </SheetHeader>
          {editing ? (
            <PanelEditor key={editing.id} panel={editing} catalog={catalog} onCancel={() => setEditing(null)} onSave={save}
              onDelete={panels.some((p) => p.id === editing.id) ? () => { setPanels((all) => all.filter((x) => x.id !== editing.id)); setEditing(null); } : undefined} />
          ) : (
            <div className="space-y-2 p-4">
              {panels.map((p) => (
                <button key={p.id} type="button" className="block w-full rounded-md border border-border px-3 py-2 text-left hover:bg-muted" onClick={() => setEditing(p)}>
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">{p.tests.join(" · ") || "No tests"}</span>
                </button>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setEditing({ id: `p${Date.now()}`, name: "", tests: [] })}><Plus size={14} /> Create panel</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PanelEditor({ panel, catalog, onSave, onCancel, onDelete }: { panel: TestPanel; catalog: string[]; onSave: (p: TestPanel) => void; onCancel: () => void; onDelete?: (() => void) | undefined }) {
  const [name, setName] = useState(panel.name);
  const [tests, setTests] = useState(panel.tests);
  const [q, setQ] = useState("");
  const query = q.trim();
  const suggestions = query ? catalog.filter((t) => t.toLowerCase().includes(query.toLowerCase()) && !tests.includes(t)).slice(0, 6) : [];
  const add = (t: string) => { const n = t.trim(); if (n && !tests.some((x) => x.toLowerCase() === n.toLowerCase())) setTests((all) => [...all, n]); setQ(""); };
  const move = (i: number, d: number) => setTests((all) => { const a = [...all]; const j = i + d; if (j < 0 || j >= a.length) return a; const tmp = a[i]!; a[i] = a[j]!; a[j] = tmp; return a; });

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="panel-name" className="mb-1 block text-sm font-semibold">Panel name</label>
        <Input id="panel-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diabetes review" />
      </div>
      <div>
        <span className="mb-1 block text-sm font-semibold">Tests</span>
        {tests.length === 0 && <p className="mb-2 text-sm text-muted-foreground">No tests yet.</p>}
        <ul className="mb-2 space-y-1">
          {tests.map((t, i) => (
            <li key={t} className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
              <span className="flex-1 text-sm font-medium">{t}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move ${t} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move ${t} down`} disabled={i === tests.length - 1} onClick={() => move(i, 1)}><ArrowDown size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove ${t} from panel`} onClick={() => setTests((all) => all.filter((x) => x !== t))}><X size={13} /></Button>
            </li>
          ))}
        </ul>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add test…" aria-label="Add test to panel"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(suggestions[0] ?? q); } }} />
        {query && <div className="mt-1 overflow-hidden rounded-md border border-border">
          {suggestions.map((t) => <button key={t} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => add(t)}>{t}</button>)}
          {!catalog.some((t) => t.toLowerCase() === query.toLowerCase()) && <button type="button" className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm font-medium hover:bg-muted" onClick={() => add(q)}><Plus size={13} /> Add “{query}” as unlisted</button>}
        </div>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!name.trim() || tests.length === 0} onClick={() => onSave({ ...panel, name: name.trim(), tests })}>Save panel</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        {onDelete && <Button variant="ghost" className="ml-auto text-destructive" onClick={onDelete}><Trash2 size={14} /> Delete</Button>}
      </div>
    </div>
  );
}
