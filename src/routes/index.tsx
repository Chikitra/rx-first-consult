import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Activity, ArrowLeft, ArrowRight, ChevronDown, ClipboardList, Clock3, FileText, History, Pencil, Plus, Printer, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
type Section = "complaints" | "vitals" | "examination" | "investigations" | "medicines" | "followup";
type NoteKey = "complaint" | "examination" | "diagnosis" | "investigations" | "followup";
type VitalKey = "bloodPressure" | "pulse" | "temperature" | "oxygen" | "weight";
const sections: { key: Section; label: string }[] = [
  { key: "complaints", label: "Chief Complaints" },
  { key: "vitals", label: "Vitals" },
  { key: "examination", label: "Examination" },
  { key: "investigations", label: "Investigations" },
  { key: "medicines", label: "Medicines" },
  { key: "followup", label: "Follow-up" },
];
const catalog = [
  "Paracetamol 500 mg tablet", "Paracetamol 650 mg tablet", "Amoxicillin 500 mg capsule",
  "Azithromycin 500 mg tablet", "Cetirizine 10 mg tablet", "Pantoprazole 40 mg tablet",
  "Omeprazole 20 mg capsule", "Metformin 500 mg tablet", "Amlodipine 5 mg tablet",
  "Losartan 50 mg tablet", "Ibuprofen 400 mg tablet", "ORS sachet",
  "Vitamin D3 60,000 IU capsule", "Montelukast 10 mg tablet", "Dolo 650 tablet",
];
const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "At bedtime", "As needed"];
const vitalFields: { key: VitalKey; label: string; placeholder: string; unit: string }[] = [
  { key: "bloodPressure", label: "Blood pressure", placeholder: "120/80", unit: "mmHg" },
  { key: "pulse", label: "Pulse", placeholder: "72", unit: "bpm" },
  { key: "temperature", label: "Temperature", placeholder: "98.6", unit: "°F" },
  { key: "oxygen", label: "SpO₂", placeholder: "98", unit: "%" },
  { key: "weight", label: "Weight", placeholder: "65", unit: "kg" },
];

function Consultation() {
  const [activeSection, setActiveSection] = useState<Section>("medicines");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notes, setNotes] = useState<Record<NoteKey, string>>({ complaint: "", examination: "", diagnosis: "", investigations: "", followup: "" });
  const [vitals, setVitals] = useState<Record<VitalKey, string>>({ bloodPressure: "", pulse: "", temperature: "", oxygen: "", weight: "" });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const nextId = useRef(1);
  const sectionIndex = sections.findIndex((section) => section.key === activeSection);
  const match = catalog.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5);
  const exactMatch = catalog.some((item) => item.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    if (!previewOpen) return;
    const onEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [previewOpen]);

  function selectSection(key: Section, focusTab = false) {
    setActiveSection(key);
    const index = sections.findIndex((section) => section.key === key);
    const tab = tabsRef.current[index];
    if (focusTab) tab?.focus();
    tab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = event.key === "ArrowRight" ? (index + 1) % sections.length
      : event.key === "ArrowLeft" ? (index - 1 + sections.length) % sections.length
      : event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : -1;
    if (target === -1) return;
    event.preventDefault();
    selectSection(sections[target].key, true);
  }
  function updateNote(key: NoteKey, value: string) {
    setNotes((current) => ({ ...current, [key]: value }));
  }
  function addMedicine(name: string) {
    const trimmed = name.trim();
    if (!trimmed) { searchRef.current?.focus(); return; }
    const id = nextId.current++;
    setMedicines((items) => [...items, { id, name: trimmed, dose: "", frequency: "Twice daily", duration: "", instructions: "" }]);
    setQuery("");
    setSearchOpen(false);
    setError("");
    requestAnimationFrame(() => document.getElementById(`dose-${id}`)?.focus());
  }
  function updateMedicine(id: number, field: keyof Medicine, value: string) {
    setMedicines((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setError("");
  }
  function generate() {
    if (!medicines.length) {
      setError("Add a medicine to generate a prescription.");
      selectSection("medicines");
      requestAnimationFrame(() => searchRef.current?.focus());
      return;
    }
    const incomplete = medicines.find((item) => !item.name.trim() || !item.dose.trim() || !item.duration.trim());
    if (incomplete) {
      setError("Add a dose and duration for each medicine before generating.");
      selectSection("medicines");
      requestAnimationFrame(() => document.getElementById(`dose-${incomplete.id}`)?.focus());
      return;
    }
    setError("");
    setPreviewOpen(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex shrink-0 items-center gap-2.5 text-xl font-bold"><span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Activity size={19} strokeWidth={2.4} /></span>Chikitra</div>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:block">Doctor workspace</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground"><span className="size-2 rounded-full bg-success" /> <span className="hidden sm:inline">Consultation in progress</span><span className="sm:hidden">In progress</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-36 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} aria-hidden="true" /><span>Live OPD queue</span><span className="px-1">/</span><span className="font-medium text-foreground">Consultation</span></div>
        <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary"><span className="size-1.5 rounded-full bg-primary" /> In consultation</div>
            <h1 className="text-2xl font-bold sm:text-3xl">Ankeeta Roy</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"><span>26 years · Female</span><span className="text-border">|</span><span>Patient ID P6231C</span></div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><History size={16} /> Past visits <ChevronDown size={14} className={historyOpen ? "rotate-180" : ""} /></Button>
        </div>
        {historyOpen && <div className="mb-5 border-t border-border py-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">27 Sep 2026</span><span className="text-xs font-medium text-primary">Completed · Rx available</span></div><p className="mt-1 text-muted-foreground">Previous consultation with Dr. Ankeeta Roy</p></div>}

        <div className="-mx-4 border-y border-border bg-card sm:mx-0" role="tablist" aria-label="Consultation sections">
          <div className="flex overflow-x-auto overscroll-x-contain px-4 sm:px-0">
            {sections.map((section, index) => <Button
              key={section.key}
              ref={(node) => { tabsRef.current[index] = node; }}
              variant="ghost"
              role="tab"
              id={`tab-${section.key}`}
              aria-controls={`panel-${section.key}`}
              aria-selected={activeSection === section.key}
              tabIndex={activeSection === section.key ? 0 : -1}
              onClick={() => selectSection(section.key)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`relative h-14 shrink-0 rounded-none border-b-[3px] px-4 text-sm transition-colors first:pl-0 sm:px-5 ${activeSection === section.key ? "border-primary bg-secondary/50 font-bold text-primary hover:bg-secondary/50" : "border-transparent font-medium text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >{section.label}{section.key === "medicines" && medicines.length > 0 && <span className="ml-1.5 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">{medicines.length}</span>}</Button>)}
          </div>
        </div>

        <div className="max-w-4xl pt-7 sm:pt-9" role="tabpanel" id={`panel-${activeSection}`} aria-labelledby={`tab-${activeSection}`}>
          {activeSection === "medicines" && <section aria-labelledby="prescription-title">
            <div className="mb-5 flex items-end justify-between gap-3"><div><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-primary"><FileText size={15} /> Primary workspace</div><h2 id="prescription-title" className="text-2xl font-bold">Prescription <span className="font-normal text-muted-foreground">/ Medicines</span></h2></div><span className="shrink-0 text-sm text-muted-foreground">{medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}</span></div>
            <div className="relative z-10" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
              <div className="flex items-center gap-2 rounded-md border border-primary bg-card p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring/25">
                <Search className="ml-2 shrink-0 text-primary" size={20} aria-hidden="true" />
                <Input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addMedicine(match[0] ?? query); } if (event.key === "Escape") setSearchOpen(false); }} className="h-10 min-w-0 border-0 px-1 shadow-none focus-visible:ring-0" placeholder="Search medicine or type a name…" aria-label="Search medicine" autoComplete="off" />
                <Button onClick={() => addMedicine(match[0] ?? query)} className="shrink-0" disabled={!query.trim()} aria-label="Add medicine"><Plus size={17} /><span className="hidden sm:inline">Add medicine</span></Button>
              </div>
              {searchOpen && query.trim() && <div className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg" role="listbox" aria-label="Medicine suggestions">
                {match.map((item) => <Button key={item} variant="ghost" className="h-auto w-full justify-start rounded-none px-4 py-3 text-left font-normal" onMouseDown={(event) => event.preventDefault()} onClick={() => addMedicine(item)} role="option" aria-selected="false"><Search size={14} className="text-muted-foreground" />{item}</Button>)}
                {!exactMatch && <Button variant="ghost" className="h-auto w-full justify-start rounded-none border-t border-border px-4 py-3 text-left font-medium text-primary" onMouseDown={(event) => event.preventDefault()} onClick={() => addMedicine(query)} role="option" aria-selected="false"><Plus size={15} /> Add “{query.trim()}” manually</Button>}
              </div>}
            </div>
            {medicines.length === 0 ? <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card px-4 py-8 text-center"><span className="mb-3 flex size-10 items-center justify-center rounded-md bg-secondary text-primary"><Plus size={21} /></span><h3 className="font-semibold">Start prescription</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">Search for a medicine above or add one manually.</p></div> : <div className="mt-5 space-y-3">
              {medicines.map((medicine, index) => <div key={medicine.id} className="rounded-md border border-border bg-card p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1">{editingMedicineId === medicine.id ? <Input autoFocus aria-label="Medicine name" value={medicine.name} onChange={(event) => updateMedicine(medicine.id, "name", event.target.value)} onBlur={() => setEditingMedicineId(null)} onKeyDown={(event) => { if (event.key === "Enter") setEditingMedicineId(null); }} /> : <h3 className="break-words font-semibold leading-7">{medicine.name}</h3>}<p className="text-xs text-muted-foreground">Medicine</p></div></div><div className="flex shrink-0 items-center"><Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Edit ${medicine.name} name`} title="Edit medicine name" onMouseDown={(event) => event.preventDefault()} onClick={() => setEditingMedicineId(medicine.id)}><Pencil size={16} /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${medicine.name}`} title="Remove medicine" onClick={() => setMedicines((items) => items.filter((item) => item.id !== medicine.id))}><Trash2 size={16} /></Button></div></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className="block min-w-0 text-xs font-semibold text-muted-foreground">Dose<Input id={`dose-${medicine.id}`} value={medicine.dose} onChange={(event) => updateMedicine(medicine.id, "dose", event.target.value)} placeholder="e.g. 1 tablet" className="mt-1.5 h-10 text-foreground" /></label>
                  <div className="min-w-0 text-xs font-semibold text-muted-foreground"><label htmlFor={`frequency-${medicine.id}`}>Frequency</label><Select value={medicine.frequency} onValueChange={(value) => updateMedicine(medicine.id, "frequency", value)}><SelectTrigger id={`frequency-${medicine.id}`} className="mt-1.5 h-10 font-normal text-foreground"><SelectValue /></SelectTrigger><SelectContent>{frequencyOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
                  <label className="block min-w-0 text-xs font-semibold text-muted-foreground">Duration<Input value={medicine.duration} onChange={(event) => updateMedicine(medicine.id, "duration", event.target.value)} placeholder="e.g. 5 days" className="mt-1.5 h-10 text-foreground" /></label>
                  <label className="col-span-2 block min-w-0 text-xs font-semibold text-muted-foreground sm:col-span-3">Instructions <span className="font-normal">(optional)</span><Input value={medicine.instructions} onChange={(event) => updateMedicine(medicine.id, "instructions", event.target.value)} placeholder="e.g. After food" className="mt-1.5 h-10 text-foreground" /></label>
                </div>
              </div>)}
            </div>}
          </section>}

          {activeSection === "complaints" && <section><div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ClipboardList size={15} /> Optional clinical notes</div><h2 className="text-2xl font-bold">Chief Complaints</h2><label htmlFor="complaint" className="mt-7 block text-sm font-medium">Presenting complaints</label><Textarea id="complaint" className="mt-2 min-h-32 bg-card" value={notes.complaint} onChange={(event) => updateNote("complaint", event.target.value)} placeholder="Enter complaints, if relevant…" /></section>}
          {activeSection === "vitals" && <section><div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Activity size={15} /> Optional clinical notes</div><h2 className="text-2xl font-bold">Vitals</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{vitalFields.map((field) => <label key={field.key} className="block text-sm font-medium">{field.label}<div className="mt-2 flex items-center overflow-hidden rounded-md border border-input bg-card"><Input className="min-w-0 border-0 shadow-none focus-visible:ring-0" value={vitals[field.key]} onChange={(event) => setVitals((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} aria-label={field.label} /><span className="shrink-0 pr-3 text-xs text-muted-foreground">{field.unit}</span></div></label>)}</div></section>}
          {activeSection === "examination" && <section><div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ClipboardList size={15} /> Optional clinical notes</div><h2 className="text-2xl font-bold">Examination</h2><div className="mt-7 space-y-5"><div><label htmlFor="examination" className="block text-sm font-medium">Findings</label><Textarea id="examination" className="mt-2 min-h-28 bg-card" value={notes.examination} onChange={(event) => updateNote("examination", event.target.value)} placeholder="Enter findings, if relevant…" /></div><div><label htmlFor="diagnosis" className="block text-sm font-medium">Diagnosis <span className="font-normal text-muted-foreground">(optional)</span></label><Input id="diagnosis" className="mt-2 bg-card" value={notes.diagnosis} onChange={(event) => updateNote("diagnosis", event.target.value)} placeholder="Enter diagnosis, if relevant…" /></div></div></section>}
          {activeSection === "investigations" && <section><div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ClipboardList size={15} /> Optional clinical notes</div><h2 className="text-2xl font-bold">Investigations</h2><label htmlFor="investigations" className="mt-7 block text-sm font-medium">Investigations / tests</label><Textarea id="investigations" className="mt-2 min-h-32 bg-card" value={notes.investigations} onChange={(event) => updateNote("investigations", event.target.value)} placeholder="Enter tests or investigations, if needed…" /></section>}
          {activeSection === "followup" && <section><div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Clock3 size={15} /> Optional clinical notes</div><h2 className="text-2xl font-bold">Follow-up</h2><label htmlFor="followup" className="mt-7 block text-sm font-medium">Follow-up advice</label><Textarea id="followup" className="mt-2 min-h-32 bg-card" value={notes.followup} onChange={(event) => updateNote("followup", event.target.value)} placeholder="Enter follow-up advice, if needed…" /></section>}

          <nav aria-label="Section navigation" className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-5">
            {sectionIndex > 0 ? <Button variant="outline" onClick={() => selectSection(sections[sectionIndex - 1].key, true)}><ArrowLeft size={16} /> Previous</Button> : <span />}
            {sectionIndex < sections.length - 1 ? <Button variant="outline" onClick={() => selectSection(sections[sectionIndex + 1].key, true)}>Next <ArrowRight size={16} /></Button> : <span />}
          </nav>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm print:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-4"><div className="hidden text-sm text-muted-foreground sm:block">{medicines.length ? `${medicines.length} ${medicines.length === 1 ? "medicine" : "medicines"} added` : "Ready to prescribe"} <span className="mx-2 text-border">·</span> Clinical notes are optional</div>{error && <p className="text-xs font-medium text-destructive sm:mr-auto sm:pl-4" role="alert">{error}</p>}<Button size="lg" className="w-full sm:w-auto" onClick={generate}><FileText size={17} /> Generate Prescription</Button></div></div>

      {previewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-3 sm:p-6 print:static print:block print:bg-background print:p-0" role="dialog" aria-modal="true" aria-label="Prescription preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-md bg-card shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none"><div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4 print:hidden"><div><h2 className="font-bold">Prescription ready</h2><p className="text-xs text-muted-foreground">Review and print your prescription</p></div><Button variant="ghost" size="icon" aria-label="Close preview" onClick={() => setPreviewOpen(false)}><X size={19} /></Button></div><div className="overflow-y-auto px-5 py-6 sm:px-10 sm:py-9 print:overflow-visible print:px-10 print:py-8"><div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-5"><div><div className="flex items-center gap-2 text-xl font-bold text-primary"><Activity size={22} /> Chikitra</div><p className="mt-1 text-xs text-muted-foreground">Doctor consultation prescription</p></div><div className="text-right text-xs text-muted-foreground"><p>Dr. Ankeeta Roy</p><p>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div></div><div className="grid grid-cols-2 gap-4 border-b border-border py-5 text-sm"><div><p className="text-xs text-muted-foreground">PATIENT</p><p className="mt-1 font-semibold">Ankeeta Roy</p><p className="text-muted-foreground">26 years · Female</p></div><div className="text-right"><p className="text-xs text-muted-foreground">PATIENT ID</p><p className="mt-1 font-medium">P6231C</p></div></div><div className="py-6"><h3 className="mb-5 text-xl font-semibold text-primary">℞ <span className="ml-1 text-base text-foreground">Medicines</span></h3><div className="space-y-5">{medicines.map((medicine, index) => <div key={medicine.id} className="flex gap-4 border-b border-border pb-4 text-sm"><span className="text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div><p className="font-semibold">{medicine.name}</p><p className="mt-1 text-muted-foreground">{medicine.dose} · {medicine.frequency} · {medicine.duration}</p>{medicine.instructions && <p className="mt-1 text-muted-foreground">{medicine.instructions}</p>}</div></div>)}</div></div>{(Object.values(notes).some((value) => value.trim()) || Object.values(vitals).some((value) => value.trim())) && <div className="border-t border-border pt-5 text-sm"><h3 className="mb-3 font-semibold">Clinical context</h3>{notes.complaint.trim() && <p className="mb-2"><span className="text-muted-foreground">Chief complaints: </span>{notes.complaint}</p>}{vitalFields.filter((field) => vitals[field.key].trim()).length > 0 && <p className="mb-2"><span className="text-muted-foreground">Vitals: </span>{vitalFields.filter((field) => vitals[field.key].trim()).map((field) => `${field.label} ${vitals[field.key]} ${field.unit}`).join(" · ")}</p>}{([ ["Examination", "examination"], ["Diagnosis", "diagnosis"], ["Investigations", "investigations"], ["Follow-up", "followup"] ] as [string, NoteKey][]).filter(([, key]) => notes[key].trim()).map(([label, key]) => <p key={key} className="mb-2"><span className="text-muted-foreground">{label}: </span>{notes[key]}</p>)}</div>}<div className="mt-16 border-t border-border pt-5 text-right text-xs text-muted-foreground">Doctor's signature</div></div><div className="flex justify-end gap-2 border-t border-border px-5 py-4 print:hidden"><Button variant="outline" onClick={() => setPreviewOpen(false)}>Edit prescription</Button><Button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</Button></div></div></div>}
    </div>
  );
}
