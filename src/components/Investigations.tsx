import { useRef, useState } from "react";
import { ClipboardList, FlaskConical, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type InvestigationResult = { id: number; test: string; values: string };

/** Demo list of commonly advised tests — replace with the test catalogue when services are connected. */
export const commonTests = ["CBC", "HbA1c", "LFT", "KFT", "Lipid Profile", "Urine Routine", "ECG", "Chest X-ray", "TSH", "RBS", "FBS / PPBS", "CRP", "ESR", "Vitamin D", "Vitamin B12", "Serum Electrolytes", "USG Abdomen", "Dengue NS1", "Widal"];

export function resultLines(values: string) {
  return values.split(/[\n,;]+/).map((v) => v.trim()).filter(Boolean);
}

/** Visit → Investigation Results: tests already done, recorded/reviewed today. */
export function InvestigationResults({ results, setResults }: { results: InvestigationResult[]; setResults: (fn: (r: InvestigationResult[]) => InvestigationResult[]) => void }) {
  const [open, setOpen] = useState(false);
  const [test, setTest] = useState("");
  const [values, setValues] = useState("");
  const nextId = useRef(1);
  const testRef = useRef<HTMLInputElement>(null);

  function save() {
    if (!test.trim() || !values.trim()) return;
    setResults((r) => [...r, { id: nextId.current++, test: test.trim(), values: values.trim() }]);
    setTest(""); setValues("");
    testRef.current?.focus();
  }

  return (
    <section aria-labelledby="results-title">
      <div className="mb-2 flex items-center gap-2">
        <FlaskConical size={16} className="text-section-accent" aria-hidden />
        <h3 id="results-title" className="text-sm font-bold">Investigation Results</h3>
        <span className="text-xs text-muted-foreground">Already done — recorded or reviewed today</span>
      </div>
      <div className="rounded-md border border-border bg-card">
        {results.length > 0 && <ul className="divide-y divide-border">
          {results.map((r) => <li key={r.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.test}</p>
              <ul className="mt-0.5 space-y-0.5 text-sm tabular-nums text-muted-foreground">{resultLines(r.values).map((line, i) => <li key={i}>{line}</li>)}</ul>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${r.test} result`} onClick={() => setResults((all) => all.filter((x) => x.id !== r.id))}><X size={15} /></Button>
          </li>)}
        </ul>}
        {open ? (
          <form className={cn("grid gap-2 p-3 sm:grid-cols-[180px_1fr_auto]", results.length > 0 && "border-t border-border")} onSubmit={(e) => { e.preventDefault(); save(); }}>
            <Input ref={testRef} autoFocus aria-label="Test name" list="result-tests" value={test} onChange={(e) => setTest(e.target.value)} placeholder="Test, e.g. CBC" />
            <datalist id="result-tests">{commonTests.map((t) => <option key={t} value={t} />)}</datalist>
            <Input aria-label="Result values" value={values} onChange={(e) => setValues(e.target.value)} placeholder="e.g. Hb 11.2 g/dL, WBC 8,400 /µL" />
            <div className="flex gap-2"><Button type="submit" disabled={!test.trim() || !values.trim()}>Save result</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Done</Button></div>
          </form>
        ) : (
          <button type="button" className={cn("flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-section-ink hover:bg-section-soft", results.length > 0 && "border-t border-border")} onClick={() => setOpen(true)}><Plus size={15} /> Add result</button>
        )}
      </div>
    </section>
  );
}

/** Investigations → Tests & Advice: tests the patient should get done after today. */
export function TestsAdvice({ tests, setTests, advice, setAdvice }: { tests: string[]; setTests: (fn: (t: string[]) => string[]) => void; advice: string; setAdvice: (v: string) => void }) {
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

  return (
    <div className="space-y-6">
      <section aria-labelledby="tests-title">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList size={16} className="text-section-accent" aria-hidden />
          <h3 id="tests-title" className="text-sm font-bold">Tests & Advice</h3>
          <span className="text-xs text-muted-foreground">To get done after today</span>
        </div>
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
            {!exact && <button type="button" role="option" aria-selected={activeIdx === matches.length} className={cn("flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-section-ink hover:bg-section-soft", activeIdx === matches.length && "bg-section-soft")} onMouseDown={(e) => e.preventDefault()} onClick={() => add(query)}><Plus size={14} /> Add “{query.trim()}”</button>}
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
