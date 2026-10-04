import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Pin, PinOff, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type FrequentPrefs = { counts: Record<string, number>; pinned: string[]; hidden: string[]; order: string[] };

const MIN_USES = 2;
const VISIBLE = 8;

// Demo prescribing history for the signed-in doctor — replace with real records when services are connected.
const seedCounts: Record<string, number> = {
  "Paracetamol 500 mg tablet": 42, "Pantoprazole 40 mg tablet": 31, "Cetirizine 10 mg tablet": 27,
  "ORS sachet": 22, "Azithromycin 500 mg tablet": 18, "Ondansetron 4 mg tablet": 15,
  "Amoxicillin 500 mg capsule": 12, "Montelukast 10 mg tablet": 9, "Ibuprofen 400 mg tablet": 7,
  "Vitamin D3 60,000 IU capsule": 5, "Metformin 500 mg tablet": 4,
};

export function storageKey(doctorId: string) { return `chikitra.frequent.${doctorId}`; }
export function loadPrefs(doctorId: string): FrequentPrefs {
  try {
    const raw = localStorage.getItem(storageKey(doctorId));
    if (raw) return JSON.parse(raw) as FrequentPrefs;
  } catch { /* ignore */ }
  return { counts: { ...seedCounts }, pinned: [], hidden: [], order: [] };
}
export function recordPrescribed(doctorId: string, names: string[]) {
  const prefs = loadPrefs(doctorId);
  names.forEach((n) => { prefs.counts[n] = (prefs.counts[n] ?? 0) + 1; });
  localStorage.setItem(storageKey(doctorId), JSON.stringify(prefs));
  window.dispatchEvent(new Event("chikitra-frequent"));
}

export function chipLabel(name: string) { return name.replace(/\s+(tablet|capsule|sachet|syrup)s?$/i, ""); }

function rank(prefs: FrequentPrefs) {
  const auto = Object.entries(prefs.counts)
    .filter(([n, c]) => c >= MIN_USES && !prefs.hidden.includes(n) && !prefs.pinned.includes(n))
    .sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const all = [...prefs.pinned, ...auto];
  // Manual order wins for items the doctor reordered; the rest keep ranking.
  const ordered = prefs.order.filter((n) => all.includes(n));
  return [...ordered, ...all.filter((n) => !ordered.includes(n))];
}

export function FrequentMedicines({ doctorId, currentNames, onPick }: { doctorId: string; currentNames: string[]; onPick: (name: string) => void }) {
  const [prefs, setPrefs] = useState<FrequentPrefs | null>(null);
  const [editing, setEditing] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setPrefs(loadPrefs(doctorId));
    load();
    window.addEventListener("chikitra-frequent", load);
    return () => window.removeEventListener("chikitra-frequent", load);
  }, [doctorId]);

  const list = useMemo(() => (prefs ? rank(prefs) : []), [prefs]);
  if (!prefs) return null;

  function save(next: FrequentPrefs) { setPrefs(next); localStorage.setItem(storageKey(doctorId), JSON.stringify(next)); }
  function togglePin(n: string) {
    const p = prefs!;
    save({ ...p, pinned: p.pinned.includes(n) ? p.pinned.filter((x) => x !== n) : [...p.pinned, n], hidden: p.hidden.filter((x) => x !== n) });
  }
  function remove(n: string) {
    const p = prefs!;
    save({ ...p, pinned: p.pinned.filter((x) => x !== n), hidden: [...new Set([...p.hidden, n])], order: p.order.filter((x) => x !== n) });
  }
  function move(i: number, dir: -1 | 1) {
    const next = [...list]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[i]!; next[i] = next[j]!; next[j] = tmp;
    save({ ...prefs!, order: next });
  }
  function addManual() {
    const n = addInput.trim(); if (!n) return;
    const p = prefs!;
    save({ ...p, pinned: [...new Set([...p.pinned, n])], hidden: p.hidden.filter((x) => x !== n) });
    setAddInput("");
  }
  function pick(n: string) {
    onPick(n);
    setFlash(n); window.setTimeout(() => setFlash((f) => (f === n ? null : f)), 1200);
  }

  const chip = (n: string) => {
    const added = currentNames.includes(n.toLowerCase());
    return (
      <button key={n} type="button" onClick={() => pick(n)} title={added ? "Already in current prescription" : `Add ${n}`}
        className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
          added ? "border-section-accent bg-section-soft text-section-ink" : "border-section-border bg-section-surface text-foreground hover:border-section-accent hover:bg-section-soft",
          flash === n && "ring-2 ring-section-accent")}>
        {prefs.pinned.includes(n) && <Pin size={12} className="text-section-ink" aria-label="Pinned" />}
        {added ? <Check size={13} className="text-section-ink" /> : <Plus size={13} className="text-section-ink" />}
        {chipLabel(n)}
      </button>
    );
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-section-ink">Frequently used <span className="font-medium normal-case tracking-normal text-muted-foreground">· by you</span></h3>
        <div className="flex items-center">
          {list.length > VISIBLE && !editing && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-section-ink" onClick={() => setAllOpen(true)}>View all ({list.length})</Button>}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setEditing((e) => !e)}>{editing ? <><Check size={13} /> Done</> : <><Pencil size={13} /> Edit</>}</Button>
        </div>
      </div>

      {editing ? (
        <div className="rounded-md border border-section-border bg-card p-3">
          {list.length === 0 && <p className="mb-2 text-sm text-muted-foreground">No medicines yet. Add one below.</p>}
          <ul className="divide-y divide-border">
            {list.map((n, i) => (
              <li key={n} className="flex items-center gap-1 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm">{chipLabel(n)}</span>
                <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${n} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></Button>
                <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${n} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></Button>
                <Button variant="ghost" size="icon" className={cn("size-8", prefs.pinned.includes(n) && "text-section-ink")} aria-label={prefs.pinned.includes(n) ? `Unpin ${n}` : `Pin ${n}`} onClick={() => togglePin(n)}>{prefs.pinned.includes(n) ? <PinOff size={14} /> : <Pin size={14} />}</Button>
                <Button variant="ghost" size="icon" className="size-8 hover:text-destructive" aria-label={`Remove ${n} from frequently used`} onClick={() => remove(n)}><X size={14} /></Button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <Input value={addInput} onChange={(e) => setAddInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }} placeholder="Add a medicine, e.g. Ondansetron 4 mg tablet" className="h-9" aria-label="Add medicine to frequently used" />
            <Button variant="outline" className="h-9" onClick={addManual} disabled={!addInput.trim()}><Plus size={14} /> Pin</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Pinned medicines stay here even if you prescribe them less often.</p>
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Frequently used medicines will appear here as you prescribe.</p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible [scrollbar-width:none]">
          {list.slice(0, VISIBLE).map(chip)}
        </div>
      )}

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="consultation-theme" data-section="medicines">
          <DialogHeader><DialogTitle>Your frequently used medicines</DialogTitle></DialogHeader>
          <div className="flex flex-wrap gap-2">{list.map(chip)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
