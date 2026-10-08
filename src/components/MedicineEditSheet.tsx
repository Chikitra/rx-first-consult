import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { administrationSlots, administrationsPerDay, doseAmount, formatAmount, frequencyDisplay, frequencyForTimes, selectedTimes, slotDosesFor, tableSlots, type SlotDoses } from "@/lib/dosing-schedule";
import type { Pattern } from "@/lib/medicines";

export type Medicine = Pattern & { id: number; name: string; unlisted?: boolean; previous?: Pattern & { name: string }; stopped?: boolean; quantityOverride?: string };
export type MedicineGroup = "NEW" | "CHANGED" | "CONTINUE" | "STOP";
const normalize = (value: string) => value.trim().toLowerCase().replace(/\btablet(s)?\b/g, "tab$1").replace(/\bcapsule(s)?\b/g, "cap$1");
const slotKey = (d: SlotDoses) => administrationSlots.map((s) => d[s] ?? 0).join("-");
export function groupFor(m: Medicine): MedicineGroup {
  if (m.stopped) return "STOP";
  const prev = m.previous;
  if (!prev) return "NEW";
  const a = slotDosesFor(m), b = slotDosesFor(prev);
  const sameSchedule = a && b ? slotKey(a) === slotKey(b) : normalize(m.dose) === normalize(prev.dose) && normalize(m.frequency) === normalize(prev.frequency) && JSON.stringify(selectedTimes(m)) === JSON.stringify(selectedTimes(prev));
  return sameSchedule && (["name", "duration", "instructions"] as const).every((key) => normalize(m[key]) === normalize(prev[key] ?? "")) && !!m.sos === !!prev.sos && !m.quantityOverride ? "CONTINUE" : "CHANGED";
}
/** True when the medicine has something to give per administration (table values or a dose). */
export const hasDose = (m: Medicine) => !!m.dose.trim() || Object.values(m.slotDoses ?? {}).some((n) => (n ?? 0) > 0);
export function quantityFor(m: Medicine): string {
  if (m.quantityOverride?.trim()) return m.quantityOverride.trim();
  if (m.sos || m.frequency === "As needed") return "—";
  const days = m.duration.trim().match(/^(\d+)\s*(day|days|week|weeks)$/i);
  if (!days?.[1] || !days[2]) return "—";
  const unitMatch = (text: string) => text.match(/\b(tablet|tab|capsule|cap|sachet|ml|drop)s?\b/i)?.[1];
  // Explicit table values count units of the medicine's form; free-text doses keep their own unit.
  const unitWord = m.dose.trim() ? unitMatch(m.dose) : unitMatch(m.name);
  const doses = slotDosesFor(m);
  const perDay = doses ? Object.values(doses).reduce<number>((t, n) => t + (n ?? 0), 0) : (doseAmount(m.dose) ?? 0) * (administrationsPerDay(m) ?? 0);
  if (!unitWord || !perDay || (!m.dose.trim() && /ml|drop/i.test(unitWord))) return "—";
  const count = perDay * Number(days[1]) * (days[2].toLowerCase().startsWith("week") ? 7 : 1);
  if (!Number.isFinite(count) || count <= 0) return "—";
  const unit = /tab/i.test(unitWord) ? "tablet" : /cap/i.test(unitWord) ? "capsule" : /sachet/i.test(unitWord) ? "sachet" : /ml/i.test(unitWord) ? "mL" : "drop";
  return `${Number(count.toFixed(2))} ${unit === "mL" ? unit : `${unit}${count === 1 ? "" : "s"}`}`;
}
export function shortFrequency(value: string) { return ({ "Once daily": "OD", "Twice daily": "BD", "Three times daily": "TDS", "Four times daily": "QID", "At bedtime": "HS", "As needed": "SOS" } as Record<string, string>)[value] ?? value; }
export function shortDose(value: string) { return value.replace(/\btablet(s)?\b/i, "tab$1").replace(/\bcapsule(s)?\b/i, "cap$1"); }

const dayOptions = [3, 5, 7, 10, 14];
const slotLabel = { morning: "Morning", afternoon: "Afternoon", night: "Night" } as const;
const next = (n: number) => (n >= 2 ? 0 : n >= 1 ? 2 : 1);

/** Compact dosing: morning–afternoon–night table + days. Used for adding and editing. */
export function MedicineEditSheet({ medicine, isNew, onSave, onClose, onRemove, onClosed }: { medicine: Medicine | null; isNew: boolean; onSave: (m: Medicine) => void; onClose: () => void; onRemove: (id: number) => void; onClosed?: () => void }) {
  const [doses, setDoses] = useState<SlotDoses>({});
  const [duration, setDuration] = useState("");
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    if (!medicine) return;
    setDoses({ ...(slotDosesFor(medicine) ?? {}) });
    setDuration(medicine.duration);
    setCustom(!!medicine.duration && medicine.duration !== "Continue" && !dayOptions.some((d) => `${d} days` === medicine.duration));
  }, [medicine]);
  if (!medicine) return <Sheet open={false} />;
  const times = administrationSlots.filter((s) => (doses[s] ?? 0) > 0);
  const result: Medicine = {
    ...medicine,
    slotDoses: doses,
    administrationTimes: times,
    frequency: frequencyForTimes(times, medicine.frequency === "At bedtime" || medicine.frequency === "HS"),
    duration,
    sos: false,
    // A plain "1 tablet" dose is now carried by the table; keep descriptive doses (e.g. "1 sachet in 1 L water").
    dose: /^(½|1\/2|0\.5|\d+(\.\d+)?)\s*(tablet|tab|capsule|cap)s?$/i.test(medicine.dose.trim()) ? "" : medicine.dose,
  };
  const ready = times.length > 0 && !!duration.trim() && !!medicine.name.trim();
  const quantity = quantityFor(result);
  const save = () => { if (ready) { onSave(result); onClose(); } };
  const customDays = duration.match(/^(\d+)/)?.[1] ?? "";
  return <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}><SheetContent side="bottom" onCloseAutoFocus={(e) => { if (onClosed) { e.preventDefault(); onClosed(); } }} onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); save(); } }} className="consultation-theme mx-auto flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-md border-section-border bg-card p-0" data-section="medicines">
    <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left"><SheetTitle className="pr-6">{medicine.name}</SheetTitle><SheetDescription>{medicine.unlisted ? "Unlisted medicine · " : ""}{isNew ? "How often and for how many days" : medicine.previous ? "Previously prescribed · changes are grouped automatically" : "Edit dosing"}</SheetDescription></SheetHeader>
    <div className="space-y-5 overflow-y-auto px-5 py-5">
      <fieldset><legend className="sr-only">Frequency — tap to change 0, 1, 2</legend>
        <div className="grid grid-cols-3 gap-2">{tableSlots.map((slot) => { const value = doses[slot] ?? 0; return <button key={slot} type="button" aria-label={`${slotLabel[slot]}: ${formatAmount(value)}`} onClick={() => setDoses((d) => ({ ...d, [slot]: next(d[slot] ?? 0) }))} className={cn("flex h-20 flex-col items-center justify-center gap-1 rounded-md border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-section-accent", value > 0 ? "border-section-accent bg-section-soft text-section-ink" : "border-border bg-card text-muted-foreground")}><span className="text-[11px] font-semibold uppercase tracking-wider">{slotLabel[slot]}</span><span className="text-2xl font-bold tabular-nums">{formatAmount(value)}</span></button>; })}</div>
        <p className="mt-2 text-center text-sm font-medium text-section-ink" aria-live="polite" data-testid="schedule-summary">{times.length ? frequencyDisplay(result) : "Tap a time to set the dose"}</p>
      </fieldset>
      <fieldset className="space-y-2"><legend className="text-xs font-bold uppercase text-muted-foreground">For</legend>
        <div className="flex flex-wrap gap-1.5">{dayOptions.map((d) => { const on = !custom && duration === `${d} days`; return <Button key={d} type="button" variant="outline" aria-pressed={on} className={cn("h-10 min-w-11 px-3", on && "border-section-accent bg-section-soft font-semibold text-section-ink")} onClick={() => { setCustom(false); setDuration(`${d} days`); }}>{d}</Button>; })}
          <Button type="button" variant="outline" aria-pressed={custom} className={cn("h-10 px-3", custom && "border-section-accent bg-section-soft text-section-ink")} onClick={() => { setCustom(true); setDuration(""); }}>Custom</Button>
          <Button type="button" variant="outline" aria-pressed={duration === "Continue"} className={cn("h-10 px-3", duration === "Continue" && "border-section-accent bg-section-soft font-semibold text-section-ink")} onClick={() => { setCustom(false); setDuration("Continue"); }}>Continue</Button>
        </div>
        {custom && <label className="flex items-center gap-2 text-sm"><Input autoFocus aria-label="Number of days" inputMode="numeric" className="h-10 w-20" value={customDays} onChange={(e) => { const n = e.target.value.replace(/\D/g, ""); setDuration(n ? `${n} day${n === "1" ? "" : "s"}` : ""); }} /> days</label>}
      </fieldset>
      <p className="text-xs text-muted-foreground">Quantity: <span className="font-semibold text-foreground">{quantity === "—" ? duration === "Continue" ? "not calculated (continuing)" : "—" : quantity}</span>{medicine.instructions ? ` · ${medicine.instructions}` : ""}</p>
    </div>
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-5 py-4">
      <div className="flex gap-1">{!isNew && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => { onRemove(medicine.id); onClose(); }}>Remove</Button>}{!isNew && medicine.previous && <Button type="button" variant="ghost" size="sm" onClick={() => { onSave({ ...medicine, stopped: !medicine.stopped }); onClose(); }}>{medicine.stopped ? "Resume" : "Stop"}</Button>}</div>
      <Button type="button" className="min-w-28" onClick={save} disabled={!ready}>{isNew ? "Add" : "Save"}</Button>
    </div>
  </SheetContent></Sheet>;
}
