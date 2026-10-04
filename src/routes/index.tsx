import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, FileText, History, Pencil, Plus, Printer, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FrequentMedicines, recordPrescribed } from "@/components/FrequentMedicines";

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

type Medicine = { id: number; name: string; dose: string; frequency: string; duration: string; instructions: string };
type AllergyStatus = "unknown" | "none" | "known";
type SectionKey = "complaints" | "vitals" | "examination" | "investigations" | "medicines" | "followup";
type VitalKey = "bp" | "pulse" | "temp" | "spo2" | "weight";

const sections: { key: SectionKey; label: string }[] = [
  { key: "complaints", label: "Chief Complaints" },
  { key: "vitals", label: "Vitals" },
  { key: "examination", label: "Examination" },
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

const catalog = [
  "Paracetamol 500 mg tablet", "Paracetamol 650 mg tablet", "Amoxicillin 500 mg capsule",
  "Azithromycin 500 mg tablet", "Cetirizine 10 mg tablet", "Pantoprazole 40 mg tablet",
  "Omeprazole 20 mg capsule", "Metformin 500 mg tablet", "Amlodipine 5 mg tablet",
  "Losartan 50 mg tablet", "Ibuprofen 400 mg tablet", "ORS sachet",
  "Vitamin D3 60,000 IU capsule", "Montelukast 10 mg tablet", "Dolo 650 tablet", "Ondansetron 4 mg tablet",
];
const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "At bedtime", "As needed"];
const followupPresets = ["3 days", "5 days", "1 week", "2 weeks", "1 month"];

type PastMedicine = Omit<Medicine, "id">;
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

function LastPrescription({ currentNames, onRepeat }: { currentNames: string[]; onRepeat: (items: PastMedicine[]) => void }) {
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
  const [error, setError] = useState("");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const match = catalog.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5);
  const exactMatch = catalog.some((item) => item.toLowerCase() === query.trim().toLowerCase());
  const index = sections.findIndex((s) => s.key === active);

  const filled: Record<SectionKey, boolean> = {
    complaints: !!complaints.trim(),
    vitals: Object.values(vitals).some((v) => v.trim()),
    examination: !!examination.trim(),
    investigations: !!investigations.trim(),
    medicines: medicines.length > 0,
    followup: !!followup.trim() || !!followupNote.trim(),
  };

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
  function addMedicine(name: string, frequency = "Twice daily") {
    const trimmed = name.trim();
    if (!trimmed) { searchRef.current?.focus(); return; }
    const id = nextId.current++;
    setMedicines((items) => [...items, { id, name: trimmed, dose: "", frequency, duration: "", instructions: "" }]);
    setQuery("");
    setSearchOpen(false);
    setError("");
    requestAnimationFrame(() => document.getElementById(`dose-${id}`)?.focus());
  }
  function pickFrequent(name: string) {
    const existing = medicines.find((m) => m.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      setHighlightId(existing.id);
      document.getElementById(`med-${existing.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => setHighlightId((h) => (h === existing.id ? null : h)), 1400);
      return;
    }
    // Chips add the medicine only; the doctor sets dose, frequency and duration.
    addMedicine(name, "");
  }
  function repeatMedicines(items: PastMedicine[]) {
    const added = items.map((item) => ({ ...item, id: nextId.current++ }));
    setMedicines((current) => [...current, ...added]);
    setError("");
  }
  function updateMedicine(id: number, field: keyof Medicine, value: string) {
    setMedicines((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setError("");
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
    const incomplete = medicines.find((item) => !item.name.trim() || !item.dose.trim() || !item.duration.trim());
    if (incomplete) {
      setActive("medicines");
      setError("Add a dose and duration for each medicine before generating.");
      requestAnimationFrame(() => document.getElementById(`dose-${incomplete.id}`)?.focus());
      return;
    }
    setError("");
    recordPrescribed(DOCTOR_ID, medicines.map((m) => m.name.trim()));
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

          {active === "complaints" && <SectionBlock title="Chief Complaints" hint="What brings the patient in today?"><Textarea autoFocus value={complaints} onChange={(e) => setComplaints(e.target.value)} placeholder="e.g. Fever and sore throat for 3 days" rows={4} /></SectionBlock>}

          {active === "vitals" && <SectionBlock title="Vitals" hint="Fill only what you measured.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{vitalFields.map((f, i) => <label key={f.key} className="block text-xs font-semibold text-muted-foreground">{f.label}<Input autoFocus={i === 0} inputMode="decimal" value={vitals[f.key]} onChange={(e) => setVitals((v) => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} className="mt-1.5 h-10 text-foreground" /></label>)}</div>
          </SectionBlock>}

          {active === "examination" && <SectionBlock title="Examination" hint="Key findings, if any."><Textarea autoFocus value={examination} onChange={(e) => setExamination(e.target.value)} placeholder="e.g. Throat congested, chest clear" rows={4} /></SectionBlock>}

          {active === "investigations" && <SectionBlock title="Investigations" hint="Tests to advise or results to note."><Textarea autoFocus value={investigations} onChange={(e) => setInvestigations(e.target.value)} placeholder="e.g. CBC, CRP" rows={4} /></SectionBlock>}

          {active === "medicines" && <section aria-labelledby="prescription-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
               <h2 id="prescription-title" className="border-l-4 border-section-accent pl-3 text-2xl font-bold text-section-ink">Medicines</h2>
              <span className="text-sm text-muted-foreground">{medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}</span>
            </div>
             <div className={cn("mb-4 rounded-md border px-3 py-3 sm:px-4", allergyStatus === "known" ? "border-allergy-alert-border bg-allergy-alert text-allergy-alert-foreground" : allergyStatus === "none" ? "border-allergy-clear-border bg-allergy-clear text-allergy-clear-foreground" : "border-allergy-unknown-border bg-allergy-unknown text-allergy-unknown-foreground")} aria-label="Patient drug allergy status">
               <div className="flex items-start justify-between gap-2">
                 <div className="flex min-w-0 items-start gap-2.5">
                   {allergyStatus === "none" ? <Check size={19} className="mt-0.5 shrink-0" aria-hidden="true" /> : <AlertTriangle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />}
                   <div className="min-w-0">
                     <p className="font-semibold">{allergyStatus === "known" ? "Drug Allergies" : allergyStatus === "none" ? "No known drug allergies" : "Allergy status not recorded"}</p>
                     {allergyStatus === "known" && <p className="mt-1 break-words text-sm">{allergies.join(" · ")}</p>}
                   </div>
                 </div>
                 <Button size="sm" variant="ghost" className="shrink-0 text-inherit hover:bg-background/60 hover:text-inherit" aria-expanded={allergyEditorOpen} aria-controls="allergy-editor" onClick={() => setAllergyEditorOpen((open) => !open)}>{allergyStatus === "unknown" ? <><Plus size={15} /> Add allergy</> : "Edit"}</Button>
               </div>
               {allergyEditorOpen && <div id="allergy-editor" className="mt-3 border-t border-current/20 pt-3">
                 {allergies.length > 0 && <div className="mb-3 space-y-2">{allergies.map((allergy, index) => <div key={index} className="flex items-center gap-2"><Input aria-label={`Allergy ${index + 1}`} value={allergy} onChange={(event) => { const value = event.target.value; setAllergies((items) => items.map((item, i) => i === index ? value : item)); }} onBlur={() => { if (!allergies[index]?.trim()) removeAllergy(index); }} className="h-9 bg-card text-foreground" /><Button size="icon" variant="ghost" className="shrink-0 text-inherit" aria-label={`Remove ${allergy}`} title="Remove allergy" onClick={() => removeAllergy(index)}><Trash2 size={16} /></Button></div>)}</div>}
                 <div className="flex gap-2"><Input aria-label="New drug allergy" placeholder="Drug or substance name" value={allergyInput} onChange={(event) => setAllergyInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAllergy(); } }} className="h-9 min-w-0 bg-card text-foreground" /><Button size="sm" variant="outline" className="shrink-0" onClick={addAllergy} disabled={!allergyInput.trim()}><Plus size={15} /> Add</Button></div>
                 <div className="mt-3 flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => setAllergyState("none")}><Check size={15} /> No known drug allergies</Button>{allergyStatus !== "unknown" && <Button size="sm" variant="ghost" className="text-inherit hover:text-inherit" onClick={() => setAllergyState("unknown")}>Mark not recorded</Button>}</div>
               </div>}
             </div>
            <LastPrescription currentNames={medicines.map((m) => m.name.toLowerCase())} onRepeat={repeatMedicines} />
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
             <h3 className="mt-6 mb-1 text-xs font-bold uppercase tracking-wider text-section-ink">Current prescription <span className="font-medium normal-case tracking-normal text-muted-foreground">· today</span></h3>
             {medicines.length === 0 ? <div className="mt-2 flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed border-section-border bg-card px-4 py-8 text-center"><span className="mb-3 flex size-10 items-center justify-center rounded-md bg-section-soft text-section-ink"><Plus size={21} /></span><h3 className="font-semibold">Start prescription</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">Search for a medicine above or enter one manually.</p></div> : <div className="mt-5 space-y-3">
              {medicines.map((medicine, i) => <div key={medicine.id} id={`med-${medicine.id}`} className={cn("rounded-md border border-border bg-card p-4 transition-shadow duration-500 sm:p-5", highlightId === medicine.id && "ring-2 ring-section-accent")}>
                 <div className="mb-4 flex items-start justify-between gap-3"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-section-soft text-xs font-bold text-section-ink">{String(i + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1">{editingMedicineId === medicine.id ? <Input autoFocus aria-label="Medicine name" value={medicine.name} onChange={(event) => updateMedicine(medicine.id, "name", event.target.value)} onBlur={() => setEditingMedicineId(null)} onKeyDown={(event) => { if (event.key === "Enter") setEditingMedicineId(null); }} /> : <h3 className="break-words font-semibold leading-7">{medicine.name}{medicine.unlisted && <span className="ml-2 align-middle rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Unlisted</span>}</h3>}</div></div><div className="flex shrink-0 items-center"><Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Edit ${medicine.name} name`} title="Edit medicine name" onMouseDown={(event) => event.preventDefault()} onClick={() => setEditingMedicineId(medicine.id)}><Pencil size={16} /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${medicine.name}`} title="Remove medicine" onClick={() => setMedicines((items) => items.filter((item) => item.id !== medicine.id))}><Trash2 size={16} /></Button></div></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className="block min-w-0 text-xs font-semibold text-muted-foreground">Dose<Input id={`dose-${medicine.id}`} value={medicine.dose} onChange={(event) => updateMedicine(medicine.id, "dose", event.target.value)} placeholder="e.g. 1 tablet" className="mt-1.5 h-10 text-foreground" /></label>
                  <div className="min-w-0 text-xs font-semibold text-muted-foreground"><label htmlFor={`frequency-${medicine.id}`}>Frequency</label><Select value={medicine.frequency} onValueChange={(value) => updateMedicine(medicine.id, "frequency", value)}><SelectTrigger id={`frequency-${medicine.id}`} className="mt-1.5 h-10 font-normal text-foreground"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{frequencyOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
                  <label className="block min-w-0 text-xs font-semibold text-muted-foreground">Duration<Input value={medicine.duration} onChange={(event) => updateMedicine(medicine.id, "duration", event.target.value)} placeholder="e.g. 5 days" className="mt-1.5 h-10 text-foreground" /></label>
                  <label className="col-span-2 block min-w-0 text-xs font-semibold text-muted-foreground sm:col-span-3">Instructions <span className="font-normal">(optional)</span><Input value={medicine.instructions} onChange={(event) => updateMedicine(medicine.id, "instructions", event.target.value)} placeholder="e.g. After food" className="mt-1.5 h-10 text-foreground" /></label>
                </div>
              </div>)}
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

      {previewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-3 sm:p-6 print:static print:block print:bg-background print:p-0" role="dialog" aria-modal="true" aria-label="Prescription preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-md bg-card shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none"><div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4 print:hidden"><div><h2 className="font-bold">Prescription ready</h2><p className="text-xs text-muted-foreground">Review and print your prescription</p></div><Button variant="ghost" size="icon" aria-label="Close preview" onClick={() => setPreviewOpen(false)}><X size={19} /></Button></div><div className="overflow-y-auto px-5 py-6 sm:px-10 sm:py-9 print:overflow-visible print:px-10 print:py-8"><div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-5"><div><div className="flex items-center gap-2 text-xl font-bold text-primary"><Activity size={22} /> Chikitra</div><p className="mt-1 text-xs text-muted-foreground">Doctor consultation prescription</p></div><div className="text-right text-xs text-muted-foreground"><p>Dr. Ankeeta Roy</p><p>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div></div><div className="grid grid-cols-2 gap-4 border-b border-border py-5 text-sm"><div><p className="text-xs text-muted-foreground">PATIENT</p><p className="mt-1 font-semibold">Ankeeta Roy</p><p className="text-muted-foreground">26 years · Female</p></div><div className="text-right"><p className="text-xs text-muted-foreground">PATIENT ID</p><p className="mt-1 font-medium">P6231C</p></div></div>
        {(complaints.trim() || vitalsText || examination.trim() || investigations.trim()) && <div className="space-y-1.5 border-b border-border py-4 text-sm">
          {complaints.trim() && <p><span className="text-muted-foreground">Complaints: </span>{complaints}</p>}
          {vitalsText && <p><span className="text-muted-foreground">Vitals: </span>{vitalsText}</p>}
          {examination.trim() && <p><span className="text-muted-foreground">Examination: </span>{examination}</p>}
          {investigations.trim() && <p><span className="text-muted-foreground">Investigations: </span>{investigations}</p>}
        </div>}
        <div className="py-6"><h3 className="mb-5 text-xl font-semibold text-primary">℞ <span className="ml-1 text-base text-foreground">Medicines</span></h3><div className="space-y-5">{medicines.map((medicine, i) => <div key={medicine.id} className="flex gap-4 border-b border-border pb-4 text-sm"><span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span><div><p className="font-semibold">{medicine.name}</p><p className="mt-1 text-muted-foreground">{medicine.dose} · {medicine.frequency} · {medicine.duration}</p>{medicine.instructions && <p className="mt-1 text-muted-foreground">{medicine.instructions}</p>}</div></div>)}</div></div>
        {filled.followup && <div className="text-sm"><span className="font-semibold">Follow-up: </span>{[followup && `After ${followup}`, followupNote.trim()].filter(Boolean).join(" — ")}</div>}
        <div className="mt-16 border-t border-border pt-5 text-right text-xs text-muted-foreground">Doctor's signature</div></div><div className="flex justify-end gap-2 border-t border-border px-5 py-4 print:hidden"><Button variant="outline" onClick={() => setPreviewOpen(false)}>Edit prescription</Button><Button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</Button></div></div></div>}
    </div>
  );
}

function SectionBlock({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
       <h2 className="border-l-4 border-section-accent pl-3 text-xl font-bold text-section-ink">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{hint}</p>
      {children}
    </section>
  );
}
