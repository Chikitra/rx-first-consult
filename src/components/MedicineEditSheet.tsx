import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { administrationSlots, administrationsPerDay, defaultAdministrationTimes, frequencyDisplay, frequencyForTimes, selectedTimes, type AdministrationTime } from "@/lib/dosing-schedule";
import type { Pattern } from "@/lib/medicines";

export type Medicine = Pattern & { id: number; name: string; unlisted?: boolean; previous?: Pattern & { name: string }; stopped?: boolean; quantityOverride?: string };
export type MedicineGroup = "NEW" | "CHANGED" | "CONTINUE" | "STOP";
const normalize = (value: string) => value.trim().toLowerCase().replace(/\btablet(s)?\b/g, "tab$1").replace(/\bcapsule(s)?\b/g, "cap$1");
export function groupFor(m: Medicine): MedicineGroup {
  if (m.stopped) return "STOP";
  if (!m.previous) return "NEW";
  return (["name", "dose", "frequency", "duration", "instructions"] as const).every((key) => normalize(m[key]) === normalize(m.previous?.[key] ?? "")) && JSON.stringify(selectedTimes(m)) === JSON.stringify(selectedTimes(m.previous)) && !!m.sos === !!m.previous.sos && !m.quantityOverride ? "CONTINUE" : "CHANGED";
}
export function quantityFor(m: Medicine): string {
  if (m.quantityOverride?.trim()) return m.quantityOverride.trim();
  if (m.sos || m.frequency === "As needed") return "—";
  const dose = m.dose.trim().match(/^(½|1\/2|0\.5|\d+(?:\.\d+)?)\s*(tablet|tab|capsule|cap|sachet|ml|drop)s?\b/i);
  const days = m.duration.trim().match(/^(\d+)\s*(day|days|week|weeks)$/i);
  const perDay = administrationsPerDay(m);
  if (!dose?.[1] || !dose[2] || !days?.[1] || !days[2] || !perDay) return "—";
  const amount = dose[1] === "½" || dose[1] === "1/2" ? 0.5 : Number(dose[1]);
  const count = amount * perDay * Number(days[1]) * (days[2].toLowerCase().startsWith("week") ? 7 : 1);
  if (!Number.isFinite(count) || count <= 0) return "—";
  const unit = /tab/i.test(dose[2]) ? "tablet" : /cap/i.test(dose[2]) ? "capsule" : /sachet/i.test(dose[2]) ? "sachet" : /ml/i.test(dose[2]) ? "mL" : "drop";
  return `${Number(count.toFixed(2))} ${unit === "mL" ? unit : `${unit}${count === 1 ? "" : "s"}`}`;
}
export function shortFrequency(value: string) { return ({ "Once daily": "OD", "Twice daily": "BD", "Three times daily": "TDS", "Four times daily": "QID", "At bedtime": "HS", "As needed": "SOS" } as Record<string, string>)[value] ?? value; }
export function shortDose(value: string) { return value.replace(/\btablet(s)?\b/i, "tab$1").replace(/\bcapsule(s)?\b/i, "cap$1"); }

const doses = ["½ tab", "1 tab", "2 tabs"];
const frequencies = [{ label: "OD", value: "Once daily" }, { label: "BD", value: "Twice daily" }, { label: "TDS", value: "Three times daily" }, { label: "QID", value: "Four times daily" }, { label: "HS", value: "At bedtime" }];
const foods = ["Before food", "After food", "With food", "Empty stomach", "No instruction"];
const durations = ["1 day", "3 days", "5 days", "7 days", "10 days"];
function ChipField({ label, options, value, onChange }: { label: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  const custom = !!value && !options.some((o) => normalize(o.value) === normalize(value));
  const [editing, setEditing] = useState(false);
  return <fieldset className="space-y-2"><legend className="text-xs font-bold uppercase text-muted-foreground">{label}</legend><div className="flex flex-wrap gap-1.5">{options.map((o) => <Button key={o.label} type="button" variant="outline" size="sm" aria-pressed={value === o.value && !editing} className={cn("h-8 rounded-md px-2.5 text-xs", value === o.value && !editing && "border-section-accent bg-section-soft font-semibold text-section-ink")} onClick={() => { onChange(o.value); setEditing(false); }}>{o.label}</Button>)}<Button type="button" variant="outline" size="sm" aria-pressed={editing || custom} className={cn("h-8 rounded-md px-2.5 text-xs", (editing || custom) && "border-section-accent bg-section-soft text-section-ink")} onClick={() => setEditing(true)}>Custom</Button></div>{(editing || custom) && <Input autoFocus aria-label={`Custom ${label.toLowerCase()}`} className="h-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} />}</fieldset>;
}
export function MedicineEditSheet({ medicine, onSave, onClose, onRemove }: { medicine: Medicine | null; onSave: (m: Medicine) => void; onClose: () => void; onRemove: (id: number) => void }) {
  const [draft, setDraft] = useState<Medicine | null>(medicine);
  useEffect(() => setDraft(medicine), [medicine]);
  const change = (field: keyof Medicine, value: string | boolean) => setDraft((m) => m ? { ...m, [field]: value } : m);
  function changeFrequency(frequency: string) {
    setDraft((m) => m ? { ...m, frequency, administrationTimes: defaultAdministrationTimes(frequency), sos: false } : m);
  }
  function toggleTime(slot: AdministrationTime) {
    setDraft((m) => {
      if (!m) return m;
      const current = selectedTimes(m) ?? [];
      const times = administrationSlots.filter((time) => time === slot ? !current.includes(time) : current.includes(time));
      return { ...m, administrationTimes: times, frequency: frequencyForTimes(times, m.frequency === "At bedtime" || m.frequency === "HS"), sos: false };
    });
  }
  return <Sheet open={!!medicine} onOpenChange={(open) => { if (!open) onClose(); }}><SheetContent side="bottom" className="consultation-theme mx-auto flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-t-md border-section-border bg-card p-0" data-section="medicines"><SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left"><SheetTitle>{draft?.name || "Edit medicine"}</SheetTitle><SheetDescription>{draft?.previous ? "Previously prescribed · changes are grouped automatically" : "New medicine · review before prescribing"}</SheetDescription></SheetHeader>{draft && <><div className="space-y-5 overflow-y-auto px-5 py-5"><label className="block text-xs font-bold uppercase text-muted-foreground">Medicine name<Input aria-label="Medicine name" value={draft.name} onChange={(e) => change("name", e.target.value)} className="mt-2 h-9 font-normal normal-case" /></label><ChipField key={`${draft.id}-dose`} label="Dose" value={draft.dose} onChange={(v) => change("dose", v)} options={doses.map((v) => ({ label: v, value: v }))} /><ChipField key={`${draft.id}-when`} label="When" value={draft.frequency} onChange={(v) => change("frequency", v)} options={frequencies} /><ChipField key={`${draft.id}-food`} label="Food" value={draft.instructions} onChange={(v) => change("instructions", v === "No instruction" ? "" : v)} options={foods.map((v) => ({ label: v, value: v === "No instruction" ? "" : v }))} /><ChipField key={`${draft.id}-duration`} label="Duration" value={draft.duration} onChange={(v) => change("duration", v)} options={durations.map((v) => ({ label: v, value: v }))} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.sos} onChange={(e) => change("sos", e.target.checked)} className="size-4 accent-[var(--section-accent)]" /> If needed / SOS</label><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Quantity</p><p className="font-semibold text-section-ink" aria-live="polite">{quantityFor(draft) === "—" ? "Not calculated" : quantityFor(draft)}</p></div><label className="text-xs text-muted-foreground">Override quantity<Input aria-label="Override quantity" value={draft.quantityOverride ?? ""} onChange={(e) => change("quantityOverride", e.target.value)} placeholder="Optional" className="mt-1 h-9 w-36 text-foreground" /></label></div>{draft.previous && <Button type="button" variant="outline" className={cn("w-full", draft.stopped && "border-section-accent bg-section-soft text-section-ink")} onClick={() => change("stopped", !draft.stopped)}>{draft.stopped ? "Resume medicine" : "Stop this medicine"}</Button>}</div><div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-4"><Button type="button" variant="ghost" className="text-destructive" onClick={() => { onRemove(draft.id); onClose(); }}>Remove</Button><Button type="button" onClick={() => { onSave(draft); onClose(); }} disabled={!draft.name.trim()}>Save changes</Button></div></>}</SheetContent></Sheet>;
}
