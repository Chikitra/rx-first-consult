import { useRef, useState } from "react";
import { ClipboardList, FlaskConical, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SavedPanels } from "@/components/TestPanels";

export type InvestigationResult = { id: number; test: string; values: string };

/** Demo list of commonly advised tests — replace with the test catalogue when services are connected. */
export const commonTests = ["CBC", "HbA1c", "LFT", "KFT", "Lipid Profile", "Urine Routine", "ECG", "Chest X-ray", "TSH", "RBS", "FBS", "PPBS", "Creatinine", "CRP", "ESR", "Vitamin D", "Vitamin B12", "Serum Electrolytes", "USG Abdomen", "Dengue NS1", "Widal"];

export function resultLines(values: string) {
  return values.split(/[\n,;]+/).map((v) => v.trim()).filter(Boolean);
}

/** Visit → Investigation Results: a blank, free-form note area for results that already exist. */
export function InvestigationResults({ results, setResults }: { results: InvestigationResult[]; setResults: (fn: (r: InvestigationResult[]) => InvestigationResult[]) => void }) {
  const nextId = useRef(1);
  const [focusId, setFocusId] = useState<number | null>(null);

  function add() {
    const id = nextId.current++;
    setResults((r) => [...r, { id, test: "", values: "" }]);
    setFocusId(id);
  }

  function update(id: number, patch: Partial<InvestigationResult>) {
    setResults((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <section aria-labelledby="results-title">
      <div className="mb-2 flex items-baseline gap-2">
        <FlaskConical size={16} className="text-section-accent" aria-hidden />
        <h3 id="results-title" className="text-sm font-bold">Investigation Results</h3>
        <span className="text-xs text-muted-foreground">Results already available — reports brought, tests done today, or anything received</span>
      </div>
      <div className="rounded-md border border-section-border bg-card">
        {results.length === 0 ? (
          <button type="button" className="flex w-full flex-col items-center gap-1 px-4 py-6 text-center hover:bg-section-soft" onClick={add}>
            <span className="flex size-8 items-center justify-center rounded-md bg-section-soft text-section-ink"><Plus size={18} /></span>
            <span className="text-sm font-medium text-section-ink">Add result</span>
            <span className="text-xs text-muted-foreground">Type a report in any format — no test list, no fixed fields</span>
          </button>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {results.map((r) => (
                <li key={r.id} className="grid gap-1 p-3 sm:grid-cols-[200px_1fr_auto] sm:items-start sm:gap-3 sm:p-2">
                  <Input
                    value={r.test}
                    autoFocus={r.id === focusId}
                    aria-label="Investigation name or report"
                    className="h-9 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 sm:px-2"
                    placeholder="Investigation name — e.g. CBC"
                    onChange={(e) => update(r.id, { test: e.target.value })}
                  />
                  <Textarea
                    value={r.values}
                    rows={1}
                    aria-label="Result details"
                    className="min-h-9 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 shadow-none focus-visible:ring-0 sm:px-2"
                    placeholder="Result / details — e.g. Hb 11.2, TLC 8,400, Platelets 2.1 lakh"
                    onChange={(e) => update(r.id, { values: e.target.value })}
                    onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" aria-label="Remove this result" onClick={() => setResults((all) => all.filter((x) => x.id !== r.id))}><X size={15} /></Button>
                </li>
              ))}
            </ul>
            <button type="button" className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-section-ink hover:bg-section-soft" onClick={add}><Plus size={15} /> Add result</button>
          </>
        )}
      </div>
    </section>
  );
}

/** Investigations → Tests & Advice: tests the patient should get done after today. */
export function TestsAdvice({ doctorId, tests, setTests, advice, setAdvice }: { doctorId: string; tests: string[]; setTests: (fn: (t: string[]) => string[]) => void; advice: string; setAdvice: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();
  const matches = q ? commonTests.filter((t) => t.toLowerCase().includes(q) && !tests.includes(t)).slice(0, 8) : [];
  const exact = commonTests.some((t) => t.toLowerCase() === q) || tests.some((t) => t.toLowerCase() === q);
  const total = matches.length + (exact ? 0 : 1);
  const quick = commonTests.slice(0, 8).filter((t) => !tests.includes(t));

  function add(name: string) {
    const n = name.trim();
    if (!n) return;
    setTests((t) => (t.some((x) => x.toLowerCase() === n.toLowerCase()) ? t : [...t, n]));
    setQuery(""); setActiveIdx(0);
    ref.current?.focus();
  }

  function addMany(names: string[]) {
    setTests((t) => {
      const out = [...t];
      for (const n of names) if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
      return out;
    });
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="tests-title">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList size={16} className="text-section-accent" aria-hidden />
          <h3 id="tests-title" className="text-sm font-bold">Tests & Advice</h3>
          <span className="text-xs text-muted-foreground">To get done after today</span>
        </div>
        <SavedPanels doctorId={doctorId} catalog={commonTests} current={tests} onAdd={addMany} />
        {tests.length > 0 ? <ul className="mb-3 space-y-1.5" aria-label="Advised tests">
          {tests.map((t) => <li key={t} className="flex items-center gap-3 rounded-md border border-dashed border-section-border bg-card px-3 py-2">
            <span className="h-4 w-4 shrink-0 rounded-sm border-2 border-section-accent" aria-hidden />
            <span className="flex-1 font-medium">{t}</span>
            <span className="text-xs text-muted-foreground">Advised</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove ${t}`} onClick={() => setTests((all) => all.filter((x) => x !== t))}><X size={14} /></Button>
          </li>)}
        </ul> : <p className="mb-3 text-sm text-muted-foreground">No tests advised yet.</p>}

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref={ref} className="h-11 pl-9" aria-label="Search test" enterKeyHint="done" value={query} placeholder="Search / add test…"
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (!q) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % total); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + total) % total); }
              if (e.key === "Enter") { e.preventDefault(); add(matches[activeIdx] ?? query); }
              if (e.key === "Escape") setOpen(false);
            }} />
          {open && q && <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg" role="listbox" aria-label="Test results">
            {matches.map((t, i) => <button key={t} type="button" role="option" aria-selected={activeIdx === i} className={cn("block w-full px-4 py-2.5 text-left text-sm hover:bg-section-soft", activeIdx === i && "bg-section-soft")} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActiveIdx(i)} onClick={() => add(t)}>{t}</button>)}
            {!exact && <button type="button" role="option" aria-selected={activeIdx === matches.length} className={cn("flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-section-ink hover:bg-section-soft", activeIdx === matches.length && "bg-section-soft")} onMouseDown={(e) => e.preventDefault()} onClick={() => add(query)}><Plus size={14} /> Add “{query.trim()}” as unlisted</button>}
          </div>}
        </div>
        {quick.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Common tests">
          {quick.map((t) => <button key={t} type="button" className="shrink-0 rounded-full border border-section-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-section-soft" onClick={() => add(t)}><Plus size={12} className="mr-1 inline" />{t}</button>)}
        </div>}
      </section>

      <section>
        <label htmlFor="inv-advice" className="mb-2 block text-sm font-bold">Advice</label>
        <Textarea id="inv-advice" value={advice} onChange={(e) => setAdvice(e.target.value)} rows={2} placeholder="e.g. Fasting sample for HbA1c and lipid profile; bring reports at review" />
      </section>
    </div>
  );
}
