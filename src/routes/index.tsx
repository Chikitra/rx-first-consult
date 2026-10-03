import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, Check, ChevronDown, ClipboardList, Clock3, FileText, History, Plus, Printer, Search, Stethoscope, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type ContextKey = "complaint" | "finding" | "diagnosis" | "note";

const catalog = [
  "Paracetamol 500 mg tablet", "Paracetamol 650 mg tablet", "Amoxicillin 500 mg capsule",
  "Azithromycin 500 mg tablet", "Cetirizine 10 mg tablet", "Pantoprazole 40 mg tablet",
  "Omeprazole 20 mg capsule", "Metformin 500 mg tablet", "Amlodipine 5 mg tablet",
  "Losartan 50 mg tablet", "Ibuprofen 400 mg tablet", "ORS sachet",
  "Vitamin D3 60,000 IU capsule", "Montelukast 10 mg tablet", "Dolo 650 tablet",
];
const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "At bedtime", "As needed"];
const contextLabels: Record<ContextKey, string> = { complaint: "Complaint", finding: "Finding", diagnosis: "Diagnosis", note: "Other note" };

function Consultation() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<ContextKey[]>([]);
  const [context, setContext] = useState<Record<ContextKey, string>>({ complaint: "", finding: "", diagnosis: "", note: "" });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const match = catalog.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5);
  const exactMatch = catalog.some((item) => item.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    if (!previewOpen) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [previewOpen]);

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
    if (!medicines.length) { setError("Add a medicine to generate a prescription."); searchRef.current?.focus(); return; }
    const incomplete = medicines.find((item) => !item.name.trim() || !item.dose.trim() || !item.duration.trim());
    if (incomplete) {
      setError("Add a dose and duration for each medicine before generating.");
      document.getElementById(`dose-${incomplete.id}`)?.focus();
      return;
    }
    setError("");
    setPreviewOpen(true);
  }
  function toggleContext(key: ContextKey) {
    setActiveContext((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    if (activeContext.includes(key)) setContext((current) => ({ ...current, [key]: "" }));
  }

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

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} aria-hidden="true" /><span>Live OPD queue</span><span className="px-1">/</span><span className="font-medium text-foreground">Consultation</span></div>
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary"><span className="size-1.5 rounded-full bg-primary" /> In consultation</div>
            <h1 className="text-2xl font-bold sm:text-3xl">Ankeeta Roy</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"><span>26 years · Female</span><span className="text-border">|</span><span>Patient ID P6231C</span></div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><History size={16} /> Past visits <ChevronDown size={14} className={historyOpen ? "rotate-180" : ""} /></Button>
        </div>
        {historyOpen && <div className="mb-6 rounded-md border border-border bg-card p-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">27 Sep 2026</span><span className="text-xs font-medium text-primary">Completed · Rx available</span></div><p className="mt-1 text-muted-foreground">Previous consultation with Dr. Ankeeta Roy</p></div>}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-10">
          <div className="min-w-0">
            <section aria-labelledby="prescription-title">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-primary"><FileText size={15} /> Primary workspace</div><h2 id="prescription-title" className="text-2xl font-bold">Prescription <span className="font-normal text-muted-foreground">/ Medicines</span></h2></div>
                <span className="text-sm text-muted-foreground">{medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}</span>
              </div>
              <div className="relative z-10" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
                <div className="flex items-center gap-2 rounded-md border border-primary bg-card p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring/25">
                  <Search className="ml-2 shrink-0 text-primary" size={20} aria-hidden="true" />
                  <Input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addMedicine(match[0] ?? query); } if (event.key === "Escape") setSearchOpen(false); }} className="h-10 border-0 px-1 shadow-none focus-visible:ring-0" placeholder="Search medicine or type a name…" aria-label="Search medicine" autoComplete="off" />
                  <Button onClick={() => addMedicine(match[0] ?? query)} className="shrink-0" disabled={!query.trim()} aria-label="Add medicine"><Plus size={17} /><span className="hidden sm:inline">Add medicine</span></Button>
                </div>
                {searchOpen && query.trim() && <div className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg" role="listbox" aria-label="Medicine suggestions">
                  {match.map((item) => <Button key={item} variant="ghost" className="h-auto w-full justify-start rounded-none px-4 py-3 text-left font-normal" onMouseDown={(event) => event.preventDefault()} onClick={() => addMedicine(item)} role="option" aria-selected="false"><Search size={14} className="text-muted-foreground" />{item}</Button>)}
                  {!exactMatch && <Button variant="ghost" className="h-auto w-full justify-start rounded-none border-t border-border px-4 py-3 text-left font-medium text-primary" onMouseDown={(event) => event.preventDefault()} onClick={() => addMedicine(query)} role="option" aria-selected="false"><Plus size={15} /> Add “{query.trim()}” manually</Button>}
                </div>}
              </div>
              {medicines.length === 0 ? <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card px-4 py-8 text-center"><span className="mb-3 flex size-10 items-center justify-center rounded-md bg-secondary text-primary"><Plus size={21} /></span><h3 className="font-semibold">Start prescription</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">Search for a medicine above or enter one manually.</p></div> : <div className="mt-5 space-y-3">
                {medicines.map((medicine, index) => <div key={medicine.id} className="rounded-md border border-border bg-card p-4 sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h3 className="break-words font-semibold leading-7">{medicine.name}</h3><p className="text-xs text-muted-foreground">Medicine</p></div></div><Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Remove ${medicine.name}`} title="Remove medicine" onClick={() => setMedicines((items) => items.filter((item) => item.id !== medicine.id))}><Trash2 size={16} /></Button></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className="block min-w-0 text-xs font-semibold text-muted-foreground">Dose<Input id={`dose-${medicine.id}`} value={medicine.dose} onChange={(event) => updateMedicine(medicine.id, "dose", event.target.value)} placeholder="e.g. 1 tablet" className="mt-1.5 h-10 text-foreground" /></label>
                    <div className="min-w-0 text-xs font-semibold text-muted-foreground"><label htmlFor={`frequency-${medicine.id}`}>Frequency</label><Select value={medicine.frequency} onValueChange={(value) => updateMedicine(medicine.id, "frequency", value)}><SelectTrigger id={`frequency-${medicine.id}`} className="mt-1.5 h-10 font-normal text-foreground"><SelectValue /></SelectTrigger><SelectContent>{frequencyOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
                    <label className="block min-w-0 text-xs font-semibold text-muted-foreground">Duration<Input value={medicine.duration} onChange={(event) => updateMedicine(medicine.id, "duration", event.target.value)} placeholder="e.g. 5 days" className="mt-1.5 h-10 text-foreground" /></label>
                    <label className="col-span-2 block min-w-0 text-xs font-semibold text-muted-foreground sm:col-span-3">Instructions <span className="font-normal">(optional)</span><Input value={medicine.instructions} onChange={(event) => updateMedicine(medicine.id, "instructions", event.target.value)} placeholder="e.g. After food" className="mt-1.5 h-10 text-foreground" /></label>
                  </div>
                </div>)}
              </div>}
            </section>

            <section className="mt-9 border-t border-border pt-7" aria-labelledby="context-title"><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ClipboardList size={15} /> Supporting details</div><h2 id="context-title" className="text-lg font-bold">Clinical context <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2><p className="mt-1 text-sm text-muted-foreground">Add what matters for this visit.</p>
              <div className="mt-4 flex flex-wrap gap-2">{(["complaint", "finding", "diagnosis", "note"] as ContextKey[]).map((key) => !activeContext.includes(key) && <Button key={key} variant="outline" size="sm" onClick={() => toggleContext(key)}><Plus size={15} /> {contextLabels[key]}</Button>)}</div>
              {activeContext.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{activeContext.map((key) => <div key={key} className="rounded-md border border-border bg-card p-3"><div className="mb-2 flex items-center justify-between"><label htmlFor={`context-${key}`} className="text-sm font-semibold">{contextLabels[key]}</label><Button variant="ghost" size="icon" className="size-7 text-muted-foreground" title={`Remove ${contextLabels[key].toLowerCase()}`} aria-label={`Remove ${contextLabels[key].toLowerCase()}`} onClick={() => toggleContext(key)}><X size={14} /></Button></div><Input id={`context-${key}`} value={context[key]} onChange={(event) => setContext((current) => ({ ...current, [key]: event.target.value }))} placeholder={`Add ${contextLabels[key].toLowerCase()}…`} /></div>)}</div>}
            </section>
          </div>

          <aside className="hidden lg:block"><div className="sticky top-6 border-l border-border pl-6"><div className="mb-5 flex items-center gap-2 text-sm font-semibold"><Stethoscope size={17} className="text-primary" /> Patient at a glance</div><dl className="space-y-4 text-sm"><div><dt className="text-muted-foreground">Patient</dt><dd className="mt-1 font-medium">Ankeeta Roy</dd></div><div><dt className="text-muted-foreground">Age / Sex</dt><dd className="mt-1 font-medium">26 years / Female</dd></div><div><dt className="text-muted-foreground">Patient ID</dt><dd className="mt-1 font-medium">P6231C</dd></div></dl><div className="my-6 border-t border-border" /><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={16} className="text-primary" /> Recent visit</div><p className="mt-2 text-sm text-muted-foreground">27 Sep 2026 · Completed</p></div></aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm print:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-4"><div className="hidden text-sm text-muted-foreground sm:block">{medicines.length ? `${medicines.length} ${medicines.length === 1 ? "medicine" : "medicines"} added` : "Ready to prescribe"} <span className="mx-2 text-border">·</span> Clinical notes are optional</div>{error && <p className="text-xs font-medium text-destructive sm:mr-auto sm:pl-4" role="alert">{error}</p>}<Button size="lg" className="w-full sm:w-auto" onClick={generate}><FileText size={17} /> Generate Prescription</Button></div></div>

      {previewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-3 sm:p-6 print:static print:block print:bg-background print:p-0" role="dialog" aria-modal="true" aria-label="Prescription preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-md bg-card shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none"><div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4 print:hidden"><div><h2 className="font-bold">Prescription ready</h2><p className="text-xs text-muted-foreground">Review and print your prescription</p></div><Button variant="ghost" size="icon" aria-label="Close preview" onClick={() => setPreviewOpen(false)}><X size={19} /></Button></div><div className="overflow-y-auto px-5 py-6 sm:px-10 sm:py-9 print:overflow-visible print:px-10 print:py-8"><div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-5"><div><div className="flex items-center gap-2 text-xl font-bold text-primary"><Activity size={22} /> Chikitra</div><p className="mt-1 text-xs text-muted-foreground">Doctor consultation prescription</p></div><div className="text-right text-xs text-muted-foreground"><p>Dr. Ankeeta Roy</p><p>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div></div><div className="grid grid-cols-2 gap-4 border-b border-border py-5 text-sm"><div><p className="text-xs text-muted-foreground">PATIENT</p><p className="mt-1 font-semibold">Ankeeta Roy</p><p className="text-muted-foreground">26 years · Female</p></div><div className="text-right"><p className="text-xs text-muted-foreground">PATIENT ID</p><p className="mt-1 font-medium">P6231C</p></div></div><div className="py-6"><h3 className="mb-5 text-xl font-semibold text-primary">℞ <span className="ml-1 text-base text-foreground">Medicines</span></h3><div className="space-y-5">{medicines.map((medicine, index) => <div key={medicine.id} className="flex gap-4 border-b border-border pb-4 text-sm"><span className="text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div><p className="font-semibold">{medicine.name}</p><p className="mt-1 text-muted-foreground">{medicine.dose} · {medicine.frequency} · {medicine.duration}</p>{medicine.instructions && <p className="mt-1 text-muted-foreground">{medicine.instructions}</p>}</div></div>)}</div></div>{activeContext.some((key) => context[key].trim()) && <div className="border-t border-border pt-5 text-sm"><h3 className="mb-3 font-semibold">Clinical context</h3>{activeContext.filter((key) => context[key].trim()).map((key) => <p key={key} className="mb-2"><span className="text-muted-foreground">{contextLabels[key]}: </span>{context[key]}</p>)}</div>}<div className="mt-16 border-t border-border pt-5 text-right text-xs text-muted-foreground">Doctor's signature</div></div><div className="flex justify-end gap-2 border-t border-border px-5 py-4 print:hidden"><Button variant="outline" onClick={() => setPreviewOpen(false)}>Edit prescription</Button><Button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</Button></div></div></div>}
    </div>
  );
}
