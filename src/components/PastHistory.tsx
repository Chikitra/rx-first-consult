import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Pre-existing conditions offered as one-tap chips. `full` expands the abbreviation for doctors and printouts.
const CONDITIONS: { key: string; label: string; full?: string }[] = [
  { key: "dm", label: "DM", full: "Diabetes Mellitus" },
  { key: "htn", label: "HTN", full: "Hypertension" },
  { key: "ihd", label: "IHD", full: "Ischaemic Heart Disease" },
  { key: "ckd", label: "CKD", full: "Chronic Kidney Disease" },
  { key: "cva", label: "CVA", full: "Stroke" },
  { key: "epilepsy", label: "Epilepsy" },
  { key: "asthma", label: "Asthma" },
  { key: "copd", label: "COPD", full: "Chronic Obstructive Pulmonary Disease" },
  { key: "hypothyroidism", label: "Hypothyroidism" },
  { key: "hyperthyroidism", label: "Hyperthyroidism" },
];

type PastHistoryRecord = { conditions: string[]; others: string; nil: boolean };
const emptyRecord: PastHistoryRecord = { conditions: [], others: "", nil: false };

function isMeaningful(record: PastHistoryRecord) {
  return record.conditions.length > 0 || !!record.others.trim() || record.nil;
}

export function PastHistory({ patientId }: { patientId: string }) {
  const storageKey = `chikitra:patient:${patientId}:past-history`;
  const [conditions, setConditions] = useState<string[]>([]);
  const [others, setOthers] = useState("");
  const [nil, setNil] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // What was already on record before this visit, so newly added conditions can be marked.
  const [recorded, setRecorded] = useState<PastHistoryRecord | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.conditions)) {
        const valid = saved.conditions.filter((key: unknown): key is string => typeof key === "string" && CONDITIONS.some((c) => c.key === key));
        const record: PastHistoryRecord = { conditions: valid, others: typeof saved.others === "string" ? saved.others : "", nil: saved.nil === true };
        if (isMeaningful(record)) {
          setConditions(record.conditions);
          setOthers(record.others);
          setNil(record.nil);
          setRecorded(record);
        }
      }
    } catch { /* Browser storage may be unavailable; start with an unrecorded history. */ }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      const record: PastHistoryRecord = { conditions, others, nil };
      // A blank section is "not recorded", never an assumed Nil — remove the key instead of saving emptiness.
      if (isMeaningful(record)) window.localStorage.setItem(storageKey, JSON.stringify(record));
      else window.localStorage.removeItem(storageKey);
    } catch { /* Continue the consultation when browser storage is unavailable. */ }
  }, [loaded, conditions, others, nil, storageKey]);

  function toggleCondition(key: string) {
    setConditions((current) => {
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      // Selecting a condition automatically cancels Nil.
      if (!current.includes(key)) setNil(false);
      return next;
    });
  }

  function toggleNil() {
    if (nil) { setNil(false); return; }
    if (conditions.length > 0 || others.trim()) {
      if (!window.confirm("Record Nil and clear the selected conditions and other entries?")) return;
      setConditions([]);
      setOthers("");
    }
    setNil(true);
  }

  const wasRecorded = (key: string) => recorded?.conditions.includes(key) ?? false;
  const hasRecorded = recorded !== null;

  return (
    <div>
      {hasRecorded && <p className="mb-2 text-xs text-muted-foreground">Recorded earlier — pre-selected below. Tap to update; unselecting never means the condition is ruled out.</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Pre-existing conditions">
        {CONDITIONS.map((condition) => {
          const selected = conditions.includes(condition.key);
          const isNew = selected && !wasRecorded(condition.key);
          return (
            <button
              key={condition.key}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleCondition(condition.key)}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "border-section-accent bg-section-soft font-semibold text-section-ink"
                  : "border-border bg-card text-foreground hover:border-section-accent/50 hover:bg-section-soft/50",
              )}
            >
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-sm border", selected ? "border-section-accent bg-section-accent text-primary-foreground" : "border-input bg-card")} aria-hidden="true">
                {selected && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{condition.label}</span>
                {condition.full && <span className={cn("ml-1.5 text-xs font-normal", selected ? "text-section-ink/80" : "text-muted-foreground")}>{" "}{condition.full}</span>}
              </span>
              {isNew && <span className="shrink-0 rounded-full bg-section-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">New</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={nil}
        onClick={toggleNil}
        className={cn(
          "mt-3 flex min-h-11 w-full items-center gap-2.5 rounded-md border border-dashed px-3 py-2 text-left text-sm transition-colors",
          nil ? "border-section-accent bg-section-soft font-semibold text-section-ink" : "border-border bg-card text-muted-foreground hover:border-section-accent/50 hover:bg-section-soft/50",
        )}
      >
        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-sm border", nil ? "border-section-accent bg-section-accent text-primary-foreground" : "border-input bg-card")} aria-hidden="true">
          {nil && <Check size={13} strokeWidth={3} />}
        </span>
        Nil — no known relevant past history
      </button>

      <Textarea
        aria-label="Other past history"
        value={others}
        onChange={(event) => {
          setOthers(event.target.value);
          // Typing another condition automatically cancels Nil.
          if (nil && event.target.value.trim()) setNil(false);
        }}
        placeholder="Enter other medical conditions or relevant past history..."
        rows={2}
        className="mt-3"
      />
    </div>
  );
}
