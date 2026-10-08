import type { DosingSchedule } from "@/lib/dosing-schedule";
// Demo medicine database and doctor prescribing patterns — replace with real services when connected.
export type CatalogItem = { name: string; brand: string; strength: string; composition: string; form: string };
export type Pattern = DosingSchedule & { dose: string; duration: string; instructions: string };
export type MedicineSet = { name: string; items: string[] };

const c = (name: string, brand: string, strength: string, composition: string, form: string): CatalogItem => ({ name, brand, strength, composition, form });

export const catalog: CatalogItem[] = [
  c("Paracetamol 500 mg tablet", "Paracetamol", "500 mg", "Paracetamol", "Tablet"),
  c("Paracetamol 650 mg tablet", "Paracetamol", "650 mg", "Paracetamol", "Tablet"),
  c("Dolo 650 tablet", "Dolo", "650 mg", "Paracetamol", "Tablet"),
  c("Amoxicillin 500 mg capsule", "Amoxicillin", "500 mg", "Amoxicillin", "Capsule"),
  c("Azithromycin 500 mg tablet", "Azithromycin", "500 mg", "Azithromycin", "Tablet"),
  c("Cetirizine 10 mg tablet", "Cetirizine", "10 mg", "Cetirizine hydrochloride", "Tablet"),
  c("Pantoprazole 40 mg tablet", "Pantoprazole", "40 mg", "Pantoprazole sodium", "Tablet"),
  c("Omeprazole 20 mg capsule", "Omeprazole", "20 mg", "Omeprazole", "Capsule"),
  c("Metformin 500 mg tablet", "Metformin", "500 mg", "Metformin hydrochloride", "Tablet"),
  c("Amlodipine 5 mg tablet", "Amlodipine", "5 mg", "Amlodipine besylate", "Tablet"),
  c("Losartan 50 mg tablet", "Losartan", "50 mg", "Losartan potassium", "Tablet"),
  c("Ibuprofen 400 mg tablet", "Ibuprofen", "400 mg", "Ibuprofen", "Tablet"),
  c("ORS sachet", "ORS", "21.8 g", "Oral rehydration salts", "Sachet"),
  c("Vitamin D3 60,000 IU capsule", "Vitamin D3", "60,000 IU", "Cholecalciferol", "Capsule"),
  c("Montelukast 10 mg tablet", "Montelukast", "10 mg", "Montelukast sodium", "Tablet"),
  c("Ondansetron 4 mg tablet", "Ondansetron", "4 mg", "Ondansetron", "Tablet"),
];

export const medicineSets: MedicineSet[] = [
  { name: "URTI", items: ["Paracetamol 500 mg tablet", "Cetirizine 10 mg tablet", "Montelukast 10 mg tablet"] },
  { name: "Acute gastroenteritis", items: ["ORS sachet", "Ondansetron 4 mg tablet", "Pantoprazole 40 mg tablet"] },
  { name: "Fever", items: ["Paracetamol 650 mg tablet"] },
];

// Demo usual patterns; real ones are learned from the doctor's generated prescriptions.
const seedPatterns: Record<string, Pattern> = {
  "Paracetamol 500 mg tablet": { dose: "1 tablet", frequency: "Three times daily", duration: "3 days", instructions: "After food" },
  "Pantoprazole 40 mg tablet": { dose: "1 tablet", frequency: "Once daily", duration: "5 days", instructions: "Before breakfast" },
  "Cetirizine 10 mg tablet": { dose: "1 tablet", frequency: "At bedtime", duration: "5 days", instructions: "" },
  "Azithromycin 500 mg tablet": { dose: "1 tablet", frequency: "Once daily", duration: "3 days", instructions: "" },
  "ORS sachet": { dose: "1 sachet in 1 L water", frequency: "As needed", duration: "3 days", instructions: "" },
  "Ondansetron 4 mg tablet": { dose: "1 tablet", frequency: "Twice daily", duration: "2 days", instructions: "Before food" },
};

const key = (doctorId: string) => `chikitra.patterns.${doctorId}`;
export function loadPatterns(doctorId: string): Record<string, Pattern> {
  try { const raw = localStorage.getItem(key(doctorId)); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return { ...seedPatterns };
}
export function usualPattern(doctorId: string, name: string): Pattern | undefined {
  const all = loadPatterns(doctorId);
  return all[Object.keys(all).find((k) => k.toLowerCase() === name.toLowerCase()) ?? ""];
}
export function learnPatterns(doctorId: string, meds: ({ name: string } & Pattern)[]) {
  const all = loadPatterns(doctorId);
  meds.forEach((m) => { if ((m.dose.trim() || m.slotDoses) && m.frequency && m.duration.trim()) all[m.name.trim()] = { dose: m.dose, frequency: m.frequency, duration: m.duration, instructions: m.instructions, administrationTimes: m.administrationTimes ? [...m.administrationTimes] : undefined, slotDoses: m.slotDoses ? { ...m.slotDoses } : undefined, sos: m.sos }; });
  localStorage.setItem(key(doctorId), JSON.stringify(all));
}

export type SearchResult = { kind: "medicine"; item: CatalogItem } | { kind: "set"; set: MedicineSet };
export function searchAll(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  const hit = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  const sets = medicineSets.filter((s) => hit(`${s.name} set`)).map((set) => ({ kind: "set" as const, set }));
  const meds = catalog.filter((i) => hit(`${i.name} ${i.brand} ${i.strength} ${i.composition} ${i.form}`)).map((item) => ({ kind: "medicine" as const, item }));
  return [...sets, ...meds].slice(0, 6);
}
