import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, FileText, History, Plus, Printer, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FrequentMedicines, recordPrescribed } from "@/components/FrequentMedicines";
import { catalog, learnPatterns, searchAll, usualPattern, type SearchResult } from "@/lib/medicines";
import { MedicineEditSheet, groupFor, quantityFor, shortDose, shortFrequency, type Medicine, type MedicineGroup } from "@/components/MedicineEditSheet";

// Demo signed-in doctor — replace with the authenticated doctor when services are connected.
const DOCTOR_ID = "demo-doctor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Consultation | Chikitra" },
      { name: "description", content: "A prescription-first consultation workspace for doctors on Chikitra." },
      { property: "og:title", content: "Consultation | Chikitra" },
      { property: "og:description", content: "A prescription-first consultation workspace for doctors on Chikitra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Consultation,
});

type AllergyStatus = "unknown" | "none" | "known";
type SectionKey = "visit" | "investigations" | "medicines" | "followup";
type VitalKey = "bp" | "pulse" | "temp" | "spo2" | "weight";

const sections: { key: SectionKey; label: string }[] = [
  { key: "visit", label: "Visit" },
  { key: "investigations", label: "Investigations" },
  { key: "medicines", label: "Medicines" },
  { key: "followup", label: "Follow-up" },
];
const vitalFields: { key: VitalKey; label: string; placeholder: string }[] = [
  { key: "bp", label: "BP (mmHg)", placeholder: "120/80" },
  { key: "pulse", label: "Pulse (bpm)", placeholder: "72" },
  { key: "temp", label: "Temp (°F)", placeholder: "98.6" },
  { key: "spo2", label: "SpO₂ (%)", placeholder: "98" },
  { key: "weight", label: "Weight (kg)", placeholder: "60" },
];

const chipName = (n: string) => n.replace(/\s+(tablet|capsule|sachet|syrup)s?$/i, "");
const followupPresets = ["3 days", "5 days", "1 week", "2 weeks", "1 month"];

type PastMedicine = Pick<Medicine, "name" | "dose" | "frequency" | "duration" | "instructions">;
type PastPrescription = { date: string; doctor: string; medicines: PastMedicine[] };
// Demo history, most recent first — replace with patient records when services are connected.
const pastPrescriptions: PastPrescription[] = [
  { date: "27 Sep 2026", doctor: "Dr. Ankeeta Roy", medicines: [
    { name: "Paracetamol 500 mg tablet", dose: "1 tablet", frequency: "Three times daily", duration: "3 days", instructions: "After food" },
    { name: "Pantoprazole 40 mg tablet", dose: "1 tablet", frequency: "Once daily", duration: "5 days", instructions: "Before breakfast" },
    { name: "Cetirizine 10 mg tablet", dose: "1 tablet", frequency: "At bedtime", duration: "5 days", instructions: "" },
  ] },
  { date: "02 Aug 2026", doctor: "Dr. Ankeeta Roy", medicines: [
    { name: "Azithromycin 500 mg tablet", dose: "1 tablet", frequency: "Once daily", duration: "3 days", instructions: "" },
    { name: "Montelukast 10 mg tablet", dose: "1 tablet", frequency: "At bedtime", duration: "10 days", instructions: "" },
  ] },
];

function LastPrescription({ currentNames, onRepeat, onStop }: { currentNames: string[]; onRepeat: (items: PastMedicine[]) => void; onStop: (item: PastMedicine) => void }) {
  const [index, setIndex] = useState(0);
  const rx = pastPrescriptions[index];
  const [selected, setSelected] = useState<boolean[]>(() => rx?.medicines.map(() => true) ?? []);
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState("");
  if (!rx) return <p className="mb-4 text-sm text-muted-foreground">No previous prescription available</p>;
  const count = selected.filter(Boolean).length;
  const allSelected = count === rx.medicines.length;
  function pick(i: number) {
    setIndex(i); setSelected(pastPrescriptions[i]!.medicines.map(() => true)); setShowAll(false); setNotice("");
  }
  function repeat() {
    const items = rx!.medicines.filter((_, i) => selected[i]);
    onRepeat(items);
    setNotice(`${items.length} ${items.length === 1 ? "medicine" : "medicines"} added to current prescription — review before generating.`);
    setSelected(rx!.medicines.map(() => false));
  }
  return (
    <div className="mb-5 rounded-md border border-border bg-muted/40 p-3 sm:p-4" aria-label="Last prescription">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{index === 0 ? "Last prescription" : "Previous prescription"}</p>
          <p className="text-sm font-medium">{rx.date} · {rx.doctor}</p>
        </div>
        {pastPrescriptions.length > 1 && <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}><History size={15} /> View previous prescriptions</Button>}
      </div>
      {showAll && <div className="mt-2 flex flex-wrap gap-2">{pastPrescriptions.map((p, i) => <Button key={p.date} size="sm" variant="outline" aria-pressed={i === index} className={i === index ? "font-semibold" : ""} onClick={() => pick(i)}>{p.date} · {p.medicines.length} meds</Button>)}</div>}
      <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-card">
        {rx.medicines.map((m, i) => {
          const already = currentNames.includes(m.name.toLowerCase());
          return <li key={m.name}>
            <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--section-accent)]" checked={!!selected[i]} onChange={() => setSelected((s) => s.map((v, j) => j === i ? !v : v))} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", !selected[i] && "text-muted-foreground")}>{m.name}{already && <span className="ml-2 text-xs font-medium text-section-ink">· already in today's Rx</span>}</span>
                <span className="block text-xs text-muted-foreground">{[m.dose, m.frequency, m.duration, m.instructions].filter(Boolean).join(" · ")}</span>
              </span>
            </label>
          </li>;
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={() => setSelected(rx.medicines.map(() => !allSelected))}>{allSelected ? "Deselect all" : "Select all"}</Button>
        <Button size="sm" variant="outline" className="border-section-accent text-section-ink hover:bg-section-soft hover:text-section-ink" disabled={count === 0} onClick={repeat}>{count === 0 ? "Select a medicine to repeat" : `Repeat selected (${count})`}</Button>
      </div>
      {notice && <p className="mt-2 text-xs text-section-ink" role="status">{notice}</p>}
    </div>
  );
}

function Consultation() {
  const [active, setActive] = useState<SectionKey>("medicines");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [complaints, setComplaints] = useState("");
  const [vitals, setVitals] = useState<Record<VitalKey, string>>({ bp: "", pulse: "", temp: "", spo2: "", weight: "" });
  const [examination, setExamination] = useState("");
  const [investigations, setInvestigations] = useState("");
  const [followup, setFollowup] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<number | null>(null);
  const [allergyStatus, setAllergyStatus] = useState<AllergyStatus>("unknown");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyEditorOpen, setAllergyEditorOpen] = useState(false);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergyLoaded, setAllergyLoaded] = useState(false);
  const [error, setError] = useState("");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const [activeResult, setActiveResult] = useState(0);
  const results = searchAll(query);
  const index = sections.findIndex((s) => s.key === active);
  const groups: MedicineGroup[] = ["NEW", "CHANGED", "CONTINUE", "STOP"];
  const activeMedicine = medicines.find((m) => m.id === editingMedicineId) ?? null;
  const activeMedicines = medicines.filter((m) => !m.stopped);

  const filled: Record<SectionKey, boolean> = {
    visit: !!complaints.trim() || Object.values(vitals).some((v) => !!v.trim()) || !!examination.trim(),
    investigations: !!investigations.trim(),
    medicines: medicines.length > 0,
    followup: !!followup.trim() || !!followupNote.trim(),
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("chikitra:patient:P6231C:allergies") ?? "null");
      if (saved?.status === "none") { setAllergyStatus("none"); setAllergies([]); }
      else if (saved?.status === "known" && Array.isArray(saved.allergies)) {
        const names = saved.allergies.filter((name: unknown): name is string => typeof name === "string" && !!name.trim());
        if (names.length) { setAllergyStatus("known"); setAllergies(names); }
      }
    } catch { /* Browser storage may be unavailable; keep the status unknown. */ }
    setAllergyLoaded(true);
  }, []);

  useEffect(() => {
    if (!allergyLoaded) return;
    try {
      window.localStorage.setItem("chikitra:patient:P6231C:allergies", JSON.stringify({ status: allergyStatus, allergies }));
    } catch { /* Continue the consultation when browser storage is unavailable. */ }
  }, [allergyLoaded, allergyStatus, allergies]);

  useEffect(() => {
    if (!previewOpen) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [previewOpen]);

  useEffect(() => {
    document.getElementById(`tab-${active}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  function go(key: SectionKey) { setActive(key); setError(""); }
  function highlight(id: number) {
    setHighlightId(id);
    document.getElementById(`med-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    window.setTimeout(() => setHighlightId((h) => (h === id ? null : h)), 1400);
  }
  // Single entry point for search, sets and frequent chips: add with the doctor's usual pattern, then clear and keep search focused.
  function addNames(names: string[], unlisted = false) {
    const fresh: Medicine[] = [];
    const seen = new Set(medicines.map((m) => m.name.trim().toLowerCase()));
    names.forEach((raw) => {
      const name = raw.trim();
      if (!name) return;
      const existing = medicines.find((m) => m.name.trim().toLowerCase() === name.toLowerCase());
      if (existing) { highlight(existing.id); return; }
      if (seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      const p = unlisted ? undefined : usualPattern(DOCTOR_ID, name);
      fresh.push({ id: nextId.current++, name, dose: p?.dose ?? "", frequency: p?.frequency ?? "", duration: p?.duration ?? "", instructions: p?.instructions ?? "", ...(unlisted ? { unlisted: true } : {}) });
    });
    if (fresh.length) {
      setMedicines((items) => [...items, ...fresh]);
      const last = fresh[fresh.length - 1]!.id;
      requestAnimationFrame(() => highlight(last));
    }
    setQuery("");
    setActiveResult(0);
    setError("");
    searchRef.current?.focus();
  }
  function addFromSearch(name: string, unlisted = false) { addNames([name], unlisted); }
  function selectResult(r: SearchResult) { addNames(r.kind === "set" ? r.set.items : [r.item.name]); }
  function pickFrequent(name: string) { addNames([name], !catalog.some((c) => c.name.toLowerCase() === name.toLowerCase()) && !usualPattern(DOCTOR_ID, name)); }
  function repeatMedicines(items: PastMedicine[]) {
    const added = items.filter((item) => !medicines.some((m) => m.name.toLowerCase() === item.name.toLowerCase())).map((item) => ({ ...item, previous: { ...item }, id: nextId.current++ }));
    setMedicines((current) => [...current, ...added]);
    setError("");
  }
  function stopPrevious(item: PastMedicine) {
    setMedicines((current) => {
      const existing = current.find((m) => m.name.toLowerCase() === item.name.toLowerCase());
      if (existing) return current.map((m) => m.id === existing.id ? { ...m, previous: { ...item }, stopped: true } : m);
      return [...current, { ...item, previous: { ...item }, stopped: true, id: nextId.current++ }];
    });
  }
  function addAllergy() {
    const name = allergyInput.trim();
    if (!name || allergies.some((allergy) => allergy.toLowerCase() === name.toLowerCase())) return;
    setAllergies((items) => [...items, name]);
    setAllergyStatus("known");
    setAllergyInput("");
  }
  function removeAllergy(indexToRemove: number) {
    const remaining = allergies.filter((_, index) => index !== indexToRemove);
    setAllergies(remaining);
    if (!remaining.length) setAllergyStatus("unknown");
  }
  function setAllergyState(status: "none" | "unknown") {
    setAllergyStatus(status);
    setAllergies([]);
    setAllergyInput("");
    setAllergyEditorOpen(false);
  }
  function generate() {
    if (!medicines.length) {
      setActive("medicines");
      setError("Add a medicine to generate a prescription.");
      requestAnimationFrame(() => searchRef.current?.focus());
      return;
    }
    const incomplete = activeMedicines.find((item) => !item.name.trim() || !item.dose.trim() || !item.duration.trim());
    if (incomplete) {
      setActive("medicines");
      setError("Add a dose and duration for each medicine before generating.");
      requestAnimationFrame(() => setEditingMedicineId(incomplete.id));
      return;
    }
    setError("");
    recordPrescribed(DOCTOR_ID, activeMedicines.map((m) => m.name.trim()));
    learnPatterns(DOCTOR_ID, activeMedicines);
    setPreviewOpen(true);
  }
  function onTabKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = sections[(index + (event.key === "ArrowRight" ? 1 : -1) + sections.length) % sections.length]!.key;
    go(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  const vitalsText = vitalFields.filter((f) => vitals[f.key].trim()).map((f) => `${f.label.split(" ")[0]} ${vitals[f.key]}`).join(" · ");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 text-xl font-bold text-foreground"><span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Activity size={19} strokeWidth={2.4} /></span>Chikitra</div>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:block">Doctor workspace</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="size-2 rounded-full bg-success" /> Consultation in progress</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} aria-hidden="true" /><span>Live OPD queue</span><span className="px-1">/</span><span className="font-medium text-foreground">Consultation</span></div>

        <section aria-label="Patient information" className="rounded-md border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-primary"><span className="size-1.5 rounded-full bg-primary" /> In consultation</div>
              <h1 className="truncate text-2xl font-bold">Ankeeta Roy</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"><span>26 years · Female</span><span className="text-border">|</span><span>Patient ID P6231C</span><span className="text-border">|</span><span>Last visit 27 Sep 2026</span></div>
            </div>
            <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><History size={16} /> Past visits <ChevronDown size={14} className={historyOpen ? "rotate-180" : ""} /></Button>
          </div>
          {historyOpen && <div className="mt-4 border-t border-border pt-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">27 Sep 2026</span><span className="text-xs font-medium text-primary">Completed · Rx available</span></div><p className="mt-1 text-muted-foreground">Previous consultation with Dr. Ankeeta Roy</p></div>}
        </section>

        <nav className="sticky top-0 z-20 -mx-4 mt-5 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:mx-0 sm:px-0" aria-label="Consultation sections">
          <div role="tablist" className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onKeyDown={onTabKey}>
            {sections.map((s) => {
              const isActive = s.key === active;
              return (
                <Button
                  key={s.key}
                  id={`tab-${s.key}`}
                   data-section={s.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="section-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => go(s.key)}
                  className={cn(
                     "consultation-theme relative h-12 shrink-0 gap-1.5 rounded-none border-0 px-3 text-sm shadow-none transition-colors focus-visible:z-10 sm:px-4",
                     isActive ? "bg-section-soft font-bold text-section-ink hover:bg-section-soft hover:text-section-ink" : "bg-transparent font-medium text-muted-foreground hover:bg-section-soft hover:text-section-ink",
                  )}
                   variant="ghost"
                >
                   <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full bg-section-accent", isActive ? "opacity-100" : "opacity-45")} />
                  {s.label}
                   {s.key === "medicines" && medicines.length > 0 && <span className="rounded-full bg-section-accent px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">{medicines.length}</span>}
                   {s.key !== "medicines" && filled[s.key] && <span className="size-1.5 rounded-full bg-section-accent" aria-label="has entries" />}
                  {s.key === "medicines" && <span className="sr-only"> (primary)</span>}
                   <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-0.5", isActive ? "bg-section-accent" : "bg-transparent")} />
                 </Button>
              );
            })}
          </div>
        </nav>

         <div id="section-panel" role="tabpanel" aria-labelledby={`tab-${active}`} data-section={active} className="consultation-theme mt-4 rounded-md border border-section-border bg-section-surface p-4 sm:p-6">
          {active !== "medicines" && (
             <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-section-border pb-3 text-sm">
               <span className="text-muted-foreground">Optional — skip anytime.</span>
              <Button size="sm" variant="ghost" className="h-8 text-primary" onClick={() => go("medicines")}>Go to Medicines <ChevronRight size={15} /></Button>
            </div>
          )}

           {active === "visit" && <div className="space-y-6">
             <h2 className="border-l-4 border-section-accent pl-3 text-2xl font-bold text-section-ink">Visit</h2>
             <SectionBlock title="Chief Complaints" hint=""><Textarea aria-label="Chief complaints" value={complaints} onChange={(e) => setComplaints(e.target.value)} placeholder="e.g. Fever and sore throat for 3 days" rows={2} /></SectionBlock>
             <SectionBlock title="Vitals" hint=""><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{vitalFields.map((f) => <label key={f.key} className="block text-xs font-semibold text-muted-foreground">{f.label}<Input inputMode="decimal" value={vitals[f.key]} onChange={(e) => setVitals((v) => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} className="mt-1.5 h-10 text-foreground" /></label>)}</div></SectionBlock>
             <SectionBlock title="Examination" hint=""><Textarea aria-label="Examination findings" value={examination} onChange={(e) => setExamination(e.target.value)} placeholder="e.g. Throat congested, chest clear" rows={2} /></SectionBlock>
             <AllergyPanel location="visit" status={allergyStatus} allergies={allergies} editorOpen={allergyEditorOpen} setEditorOpen={setAllergyEditorOpen} input={allergyInput} setInput={setAllergyInput} setAllergies={setAllergies} addAllergy={addAllergy} removeAllergy={removeAllergy} setAllergyState={setAllergyState} />
           </div>}

          {active === "investigations" && <SectionBlock title="Investigations" hint="Tests to advise or results to note."><Textarea autoFocus value={investigations} onChange={(e) => setInvestigations(e.target.value)} placeholder="e.g. CBC, CRP" rows={4} /></SectionBlock>}

          {active === "medicines" && <section aria-labelledby="prescription-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
               <h2 id="prescription-title" className="border-l-4 border-section-accent pl-3 text-2xl font-bold text-section-ink">Medicines</h2>
              <span className="text-sm text-muted-foreground">{medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}</span>
            </div>
             <AllergyPanel location="medicines" status={allergyStatus} allergies={allergies} editorOpen={allergyEditorOpen} setEditorOpen={setAllergyEditorOpen} input={allergyInput} setInput={setAllergyInput} setAllergies={setAllergies} addAllergy={addAllergy} removeAllergy={removeAllergy} setAllergyState={setAllergyState} />
            <LastPrescription currentNames={medicines.map((m) => m.name.toLowerCase())} onRepeat={repeatMedicines} onStop={stopPrevious} />
            <div className="relative z-10" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
               <div className="flex items-center gap-2 rounded-md border border-section-accent bg-card p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-section-accent/25">
                 <Search className="ml-2 shrink-0 text-section-ink" size={20} aria-hidden="true" />
                <Input ref={searchRef} value={query} enterKeyHint="search" onChange={(event) => { setQuery(event.target.value); setActiveResult(0); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={(event) => {
                  const total = results.length + 1;
                  if (event.key === "ArrowDown") { event.preventDefault(); setActiveResult((i) => (i + 1) % total); }
                  if (event.key === "ArrowUp") { event.preventDefault(); setActiveResult((i) => (i - 1 + total) % total); }
                  if (event.key === "Enter" && query.trim()) { event.preventDefault(); const r = results[activeResult]; if (r) selectResult(r); else addFromSearch(query, true); }
                  if (event.key === "Escape") setSearchOpen(false);
                }} className="h-10 border-0 px-1 text-base shadow-none focus-visible:ring-0" placeholder="Search medicine or set..." aria-label="Search medicine or set" autoComplete="off" role="combobox" aria-expanded={searchOpen && !!query.trim()} />
                {query && <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" aria-label="Clear search" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(""); searchRef.current?.focus(); }}><X size={16} /></Button>}
              </div>
              {searchOpen && query.trim() && <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-md border border-border bg-popover shadow-lg" role="listbox" aria-label="Search results">
                {results.map((r, i) => <button type="button" key={r.kind === "set" ? `set-${r.set.name}` : r.item.name} className={cn("flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-b-0 hover:bg-section-soft", activeResult === i && "bg-section-soft")} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveResult(i)} onClick={() => selectResult(r)} role="option" aria-selected={activeResult === i}>
                  {r.kind === "set" ? <><span className="min-w-0 flex-1"><span className="block font-semibold">{r.set.name}</span><span className="block truncate text-xs text-muted-foreground">{r.set.items.length} medicines · {r.set.items.map(chipName).join(", ")}</span></span><span className="shrink-0 rounded-full border border-section-border bg-section-soft px-2 py-0.5 text-[11px] font-semibold text-section-ink">Medicine set</span></>
                  : <span className="min-w-0 flex-1"><span className="block font-semibold">{r.item.brand} <span className="font-medium text-section-ink">{r.item.strength}</span></span><span className="block truncate text-xs text-muted-foreground">{r.item.composition} {r.item.strength} · {r.item.form}</span></span>}
                </button>)}
                <button type="button" className={cn("flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-medium text-section-ink hover:bg-section-soft", activeResult === results.length && "bg-section-soft")} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveResult(results.length)} onClick={() => addFromSearch(query, true)} role="option" aria-selected={activeResult === results.length}><Plus size={15} /> Add “{query.trim()}” as unlisted</button>
              </div>}
            </div>
             <FrequentMedicines doctorId={DOCTOR_ID} currentNames={medicines.map((m) => m.name.trim().toLowerCase())} onPick={pickFrequent} />
             <div className="mt-6 flex items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-section-ink">Current prescription <span className="font-medium normal-case tracking-normal text-muted-foreground">· today</span></h3><Button size="sm" variant="ghost" className="h-8 text-section-ink" onClick={() => searchRef.current?.focus()}><Plus size={15} /> Add medicine</Button></div>
             {medicines.length === 0 ? <div className="mt-2 flex min-h-36 flex-col items-center justify-center rounded-md border border-dashed border-section-border bg-card px-4 py-6 text-center"><span className="mb-2 flex size-9 items-center justify-center rounded-md bg-section-soft text-section-ink"><Plus size={20} /></span><h3 className="font-semibold">Start prescription</h3><p className="mt-1 text-sm text-muted-foreground">Search for a medicine above or enter one manually.</p></div> : <div className="mt-3 space-y-4">
               {groups.map((group) => {
                 const items = medicines.filter((m) => groupFor(m) === group);
                 if (!items.length) return null;
                 return <section key={group} aria-label={`${group} medicines`}><div className="flex items-center gap-3 pb-1.5"><h4 className={cn("text-[11px] font-bold tracking-wider", group === "STOP" ? "text-destructive" : "text-section-ink")}>{group}</h4><span className="h-px flex-1 bg-section-border" /></div><div className="divide-y divide-border overflow-hidden rounded-md border border-section-border bg-card">{items.map((medicine) => <Button key={medicine.id} id={`med-${medicine.id}`} type="button" variant="ghost" onClick={() => setEditingMedicineId(medicine.id)} className={cn("flex h-auto min-h-16 w-full min-w-0 items-center justify-between gap-3 rounded-none px-3 py-2.5 text-left font-normal hover:bg-section-soft sm:px-4", highlightId === medicine.id && "bg-section-soft ring-2 ring-inset ring-section-accent", group === "STOP" && "border-l-2 border-destructive")}><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-foreground">{medicine.name}{medicine.unlisted && <span className="ml-2 text-[11px] font-normal text-muted-foreground">· Unlisted</span>}</span><span className={cn("mt-0.5 block whitespace-normal text-xs leading-5 text-muted-foreground", group === "STOP" && "font-semibold text-destructive")}>{group === "STOP" ? "Stop" : [shortDose(medicine.dose) || "Dose needed", shortFrequency(medicine.frequency) || "When needed", medicine.instructions, medicine.duration || "Duration needed", medicine.sos ? "SOS" : ""].filter(Boolean).join(" · ")}</span></span>{group !== "STOP" && <span className="shrink-0 whitespace-nowrap text-right text-xs font-semibold text-foreground">{quantityFor(medicine)}</span>}<ChevronRight size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" /></Button>)}</div></section>;
               })}
             </div>}
          </section>}

          {active === "followup" && <SectionBlock title="Follow-up" hint="When should the patient return?">
             <div className="flex flex-wrap gap-2">{followupPresets.map((p) => <Button key={p} size="sm" variant="outline" className={followup === p ? "border-section-accent bg-section-soft font-semibold text-section-ink hover:bg-section-soft hover:text-section-ink" : ""} aria-pressed={followup === p} onClick={() => setFollowup(followup === p ? "" : p)}>After {p}</Button>)}</div>
            <Input className="mt-3" value={followupNote} onChange={(e) => setFollowupNote(e.target.value)} placeholder="Advice or note (optional)" />
          </SectionBlock>}

           <div className="mt-8 flex items-center justify-between gap-2 border-t border-section-border pt-4">
             <Button variant="ghost" className="h-auto min-h-9 min-w-0 justify-start whitespace-normal text-left" disabled={index === 0} onClick={() => go(sections[index - 1]!.key)}><ChevronLeft size={16} /> {index > 0 ? sections[index - 1]!.label : "Previous"}</Button>
             {index < sections.length - 1 && <Button variant="outline" className="h-auto min-h-9 min-w-0 justify-end whitespace-normal text-right" onClick={() => go(sections[index + 1]!.key)}>Next: {sections[index + 1]!.label} <ChevronRight size={16} /></Button>}
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm print:hidden"><div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-4"><div className="hidden text-sm text-muted-foreground sm:block">{medicines.length ? `${medicines.length} ${medicines.length === 1 ? "medicine" : "medicines"} added` : "Ready to prescribe"} <span className="mx-2 text-border">·</span> Other sections are optional</div>{error && <p className="text-xs font-medium text-destructive sm:mr-auto sm:pl-4" role="alert">{error}</p>}<Button size="lg" className="w-full sm:w-auto" onClick={generate}><FileText size={17} /> Generate Prescription</Button></div></div>

      <MedicineEditSheet medicine={activeMedicine} onClose={() => setEditingMedicineId(null)} onSave={(updated) => { setMedicines((items) => items.map((item) => item.id === updated.id ? updated : item)); setError(""); }} onRemove={(id) => setMedicines((items) => items.filter((item) => item.id !== id))} />
      {previewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-3 sm:p-6 print:static print:block print:bg-background print:p-0" role="dialog" aria-modal="true" aria-label="Prescription preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-md bg-card shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none"><div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4 print:hidden"><div><h2 className="font-bold">Prescription ready</h2><p className="text-xs text-muted-foreground">Review and print your prescription</p></div><Button variant="ghost" size="icon" aria-label="Close preview" onClick={() => setPreviewOpen(false)}><X size={19} /></Button></div><div className="overflow-y-auto px-5 py-6 sm:px-10 sm:py-9 print:overflow-visible print:px-10 print:py-8"><div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-5"><div><div className="flex items-center gap-2 text-xl font-bold text-primary"><Activity size={22} /> Chikitra</div><p className="mt-1 text-xs text-muted-foreground">Doctor consultation prescription</p></div><div className="text-right text-xs text-muted-foreground"><p>Dr. Ankeeta Roy</p><p>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div></div><div className="grid grid-cols-2 gap-4 border-b border-border py-5 text-sm"><div><p className="text-xs text-muted-foreground">PATIENT</p><p className="mt-1 font-semibold">Ankeeta Roy</p><p className="text-muted-foreground">26 years · Female</p></div><div className="text-right"><p className="text-xs text-muted-foreground">PATIENT ID</p><p className="mt-1 font-medium">P6231C</p></div></div>
        {(complaints.trim() || vitalsText || examination.trim() || investigations.trim()) && <div className="space-y-1.5 border-b border-border py-4 text-sm">
          {complaints.trim() && <p><span className="text-muted-foreground">Complaints: </span>{complaints}</p>}
          {vitalsText && <p><span className="text-muted-foreground">Vitals: </span>{vitalsText}</p>}
          {examination.trim() && <p><span className="text-muted-foreground">Examination: </span>{examination}</p>}
          {investigations.trim() && <p><span className="text-muted-foreground">Investigations: </span>{investigations}</p>}
        </div>}
        <div className="py-6"><h3 className="mb-5 text-xl font-semibold text-primary">℞ <span className="ml-1 text-base text-foreground">Medicines</span></h3><div className="space-y-5">{medicines.map((medicine, i) => <div key={medicine.id} className="flex gap-4 border-b border-border pb-4 text-sm"><span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span><div><p className="font-semibold">{medicine.name}</p><p className="mt-1 text-muted-foreground">{medicine.stopped ? "Stop" : `${medicine.dose} · ${medicine.frequency} · ${medicine.duration}${medicine.sos ? " · SOS" : ""}`}</p>{!medicine.stopped && medicine.instructions && <p className="mt-1 text-muted-foreground">{medicine.instructions}</p>}{!medicine.stopped && quantityFor(medicine) !== "—" && <p className="mt-1 text-muted-foreground">Quantity: {quantityFor(medicine)}</p>}</div></div>)}</div></div>
        {filled.followup && <div className="text-sm"><span className="font-semibold">Follow-up: </span>{[followup && `After ${followup}`, followupNote.trim()].filter(Boolean).join(" — ")}</div>}
        <div className="mt-16 border-t border-border pt-5 text-right text-xs text-muted-foreground">Doctor's signature</div></div><div className="flex justify-end gap-2 border-t border-border px-5 py-4 print:hidden"><Button variant="outline" onClick={() => setPreviewOpen(false)}>Edit prescription</Button><Button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</Button></div></div></div>}
    </div>
  );
}

function SectionBlock({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
       <h2 className="border-l-4 border-section-accent pl-3 text-xl font-bold text-section-ink">{title}</h2>
       {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
       <div className="mt-3">{children}</div>
    </section>
  );
}

function AllergyPanel({ location, status, allergies, editorOpen, setEditorOpen, input, setInput, setAllergies, addAllergy, removeAllergy, setAllergyState }: {
  location: "visit" | "medicines"; status: AllergyStatus; allergies: string[]; editorOpen: boolean;
  setEditorOpen: React.Dispatch<React.SetStateAction<boolean>>; input: string; setInput: (value: string) => void;
  setAllergies: React.Dispatch<React.SetStateAction<string[]>>; addAllergy: () => void;
  removeAllergy: (index: number) => void; setAllergyState: (status: "none" | "unknown") => void;
}) {
  const question = location === "visit" && status === "unknown";
  const editorId = `allergy-editor-${location}`;
  return <section className={cn("rounded-md border px-3 py-3 sm:px-4", location === "medicines" && "mb-4", status === "known" ? "border-allergy-alert-border bg-allergy-alert text-allergy-alert-foreground" : status === "none" ? "border-allergy-clear-border bg-allergy-clear text-allergy-clear-foreground" : "border-allergy-unknown-border bg-allergy-unknown text-allergy-unknown-foreground")} aria-label="Patient drug allergy status">
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-start gap-2.5">
        {status === "none" ? <Check size={19} className="mt-0.5 shrink-0" aria-hidden="true" /> : <AlertTriangle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />}
        <div className="min-w-0"><h3 className="font-semibold">{question ? "Drug allergies?" : status === "known" ? "Drug allergies" : status === "none" ? "No known drug allergies" : "Allergy status not recorded"}</h3>
          {status === "known" && <p className="mt-1 break-words text-sm">{allergies.join(" · ")}</p>}
        </div>
      </div>
      {!question && <Button size="sm" variant="ghost" className="shrink-0 text-inherit hover:bg-background/60 hover:text-inherit" aria-expanded={editorOpen} aria-controls={editorId} onClick={() => setEditorOpen((open) => !open)}>{status === "unknown" ? "Record" : "Edit"}</Button>}
    </div>
    {question && <div className="mt-3 flex flex-wrap gap-2 pl-7"><Button size="sm" variant="outline" aria-expanded={editorOpen} aria-controls={editorId} onClick={() => setEditorOpen(true)}>Yes</Button><Button size="sm" variant="outline" onClick={() => setAllergyState("none")}>No known drug allergies</Button></div>}
    {editorOpen && <div id={editorId} className="mt-3 border-t border-current/20 pt-3">
      {allergies.length > 0 && <div className="mb-3 space-y-2">{allergies.map((allergy, index) => <div key={index} className="flex items-center gap-2"><Input aria-label={`Allergy ${index + 1}`} value={allergy} onChange={(event) => { const value = event.target.value; setAllergies((items) => items.map((item, i) => i === index ? value : item)); }} onBlur={() => { if (!allergies[index]?.trim()) removeAllergy(index); }} className="h-9 bg-card text-foreground" /><Button size="icon" variant="ghost" className="shrink-0 text-inherit" aria-label={`Remove ${allergy}`} title="Remove allergy" onClick={() => removeAllergy(index)}><Trash2 size={16} /></Button></div>)}</div>}
      <div className="flex gap-2"><Input aria-label="New drug allergy" placeholder="Drug or substance name" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAllergy(); } }} className="h-9 min-w-0 bg-card text-foreground" /><Button size="sm" variant="outline" className="shrink-0" onClick={addAllergy} disabled={!input.trim()}><Plus size={15} /> Add</Button></div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => setAllergyState("none")}><Check size={15} /> No known drug allergies</Button>{status !== "unknown" && <Button size="sm" variant="ghost" className="text-inherit hover:text-inherit" onClick={() => setAllergyState("unknown")}>Mark not recorded</Button>}</div>
    </div>}
  </section>;
}
