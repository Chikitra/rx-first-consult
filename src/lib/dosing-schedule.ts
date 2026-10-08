export const administrationSlots = ["morning", "afternoon", "evening", "night"] as const;
export type AdministrationTime = typeof administrationSlots[number];
export type DosingSchedule = { frequency: string; administrationTimes?: AdministrationTime[]; sos?: boolean };

const frequencies = ["Once daily", "Twice daily", "Three times daily", "Four times daily"];
const counts: Record<string, number> = { "Once daily": 1, "Twice daily": 2, "Three times daily": 3, "Four times daily": 4, "At bedtime": 1, OD: 1, BD: 2, TDS: 3, QID: 4, HS: 1 };
const labels: Record<string, string> = { "Once daily": "Once a day", "Twice daily": "Twice a day", "Three times daily": "Three times a day", "Four times daily": "Four times a day", "At bedtime": "At bedtime", OD: "Once a day", BD: "Twice a day", TDS: "Three times a day", QID: "Four times a day", HS: "At bedtime" };

export function defaultAdministrationTimes(frequency: string): AdministrationTime[] | undefined {
  const count = counts[frequency];
  if (frequency === "At bedtime" || frequency === "HS") return ["night"];
  return count === 1 ? ["afternoon"] : count === 2 ? ["morning", "night"] : count === 3 ? ["morning", "afternoon", "night"] : count === 4 ? [...administrationSlots] : undefined;
}
export function selectedTimes(schedule: DosingSchedule): AdministrationTime[] | undefined {
  // Legacy frequencies have no recorded timings: do not invent historical administration times.
  if (!Array.isArray(schedule.administrationTimes)) return undefined;
  return administrationSlots.filter((slot) => schedule.administrationTimes?.includes(slot));
}
export function frequencyForTimes(times: AdministrationTime[], bedtime = false): string {
  if (bedtime && times.length === 1 && times[0] === "night") return "At bedtime";
  return frequencies[times.length - 1] ?? "";
}
export function administrationsPerDay(schedule: DosingSchedule): number | undefined {
  if (schedule.sos || /^(as needed|sos)$/i.test(schedule.frequency.trim())) return undefined;
  const times = selectedTimes(schedule);
  return times ? times.length || undefined : counts[schedule.frequency];
}
export function frequencyDisplay(schedule: DosingSchedule): string {
  if (schedule.sos) return "As needed / SOS";
  const times = selectedTimes(schedule);
  if (!times?.length) return labels[schedule.frequency] ?? schedule.frequency;
  const label = labels[frequencyForTimes(times, schedule.frequency === "At bedtime" || schedule.frequency === "HS")];
  // Evening requires a fourth explicitly named slot, never fold two doses into 'night'.
  const slots = times.includes("evening") ? administrationSlots : ["morning", "afternoon", "night"] as const;
  const shorthand = slots.map((slot) => times.includes(slot) ? "1" : "0").join("-");
  const timing = times.includes("evening") ? " · morning–afternoon–evening–night" : "";
  return `${label} (${shorthand}${timing})`;
}