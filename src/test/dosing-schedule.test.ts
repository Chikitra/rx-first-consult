import { describe, expect, it } from "vitest";
import { administrationsPerDay, defaultAdministrationTimes, frequencyDisplay, frequencyForTimes } from "@/lib/dosing-schedule";
import { groupFor, quantityFor, type Medicine } from "@/components/MedicineEditSheet";
import { learnPatterns, usualPattern } from "@/lib/medicines";

const medicine: Medicine = { id: 1, name: "Example tablet", dose: "1 tablet", frequency: "Twice daily", duration: "5 days", instructions: "After food", administrationTimes: ["morning", "night"] };
describe("one dosing schedule", () => {
  it("generates wording and quantity for OD, BD and TDS", () => {
    for (const [frequency, text, quantity] of [["Once daily", "Once a day (0-1-0)", "5 tablets"], ["Twice daily", "Twice a day (1-0-1)", "10 tablets"], ["Three times daily", "Three times a day (1-1-1)", "15 tablets"]] as const) {
      const m = { ...medicine, frequency, administrationTimes: defaultAdministrationTimes(frequency) };
      expect(frequencyDisplay(m)).toBe(text);
      expect(quantityFor(m)).toBe(quantity);
    }
  });
  it("reflects actual slots, even if an old frequency string is stale", () => {
    const m: Medicine = { ...medicine, administrationTimes: ["morning", "afternoon"] };
    expect(frequencyDisplay(m)).toBe("Twice a day (1-1-0)");
    expect(quantityFor(m)).toBe("10 tablets");
    m.administrationTimes = ["morning", "afternoon", "night"];
    expect(frequencyDisplay(m)).toBe("Three times a day (1-1-1)");
    expect(quantityFor(m)).toBe("15 tablets");
  });
  it("keeps bedtime and a four-slot schedule unambiguous", () => {
    expect(frequencyDisplay({ frequency: "At bedtime", administrationTimes: ["night"] })).toBe("At bedtime (0-0-1)");
    const m = { ...medicine, frequency: "Four times daily", administrationTimes: defaultAdministrationTimes("QID") };
    expect(frequencyDisplay(m)).toBe("Four times a day (1-1-1-1 · morning–afternoon–evening–night)");
    expect(quantityFor(m)).toBe("20 tablets");
  });
  it("does not fabricate custom, legacy or as-needed timings", () => {
    expect(frequencyDisplay({ frequency: "Twice daily" })).toBe("Twice a day");
    expect(frequencyDisplay({ frequency: "Every other day" })).toBe("Every other day");
    expect(quantityFor({ ...medicine, frequency: "Every other day", administrationTimes: undefined })).toBe("—");
    expect(quantityFor({ ...medicine, sos: true })).toBe("—");
    expect(frequencyDisplay({ ...medicine, sos: true })).toBe("As needed / SOS");
    expect(administrationsPerDay({ ...medicine, administrationTimes: [] })).toBeUndefined();
    expect(quantityFor({ ...medicine, quantityOverride: "12 tablets" })).toBe("12 tablets");
    expect(quantityFor({ ...medicine, dose: "½ tab" })).toBe("5 tablets");
    expect(frequencyForTimes(["afternoon"])).toBe("Once daily");
  });
  it("compares repeated timing changes and persists learned slots", () => {
    const repeated = { ...medicine, previous: { ...medicine } };
    expect(groupFor(repeated)).toBe("CONTINUE");
    expect(groupFor({ ...repeated, administrationTimes: ["morning", "afternoon"] })).toBe("CHANGED");
    learnPatterns("schedule-test-doctor", [medicine]);
    expect(usualPattern("schedule-test-doctor", medicine.name)?.administrationTimes).toEqual(["morning", "night"]);
  });
});