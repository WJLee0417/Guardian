import type { IntelEvent } from "../types/guardian";

const requiredFields = [
  "schema",
  "incidentId",
  "callId",
  "createdAt",
  "extractedHow.agency",
  "extractedHow.appName",
  "extractedHow.url",
  "extractedHow.requiredAction",
  "risk.riskScore",
  "risk.riskLevel",
  "safeguard.promptInjectionDetected",
  "integrity.payload_hash",
  "integrity.timeline_hash",
  "routing_targets",
  "status",
];

export function validateIntelEvent(event: IntelEvent | null): { valid: boolean; missing: string[] } {
  if (!event) return { valid: false, missing: requiredFields };
  const missing = requiredFields.filter((field) => {
    const value = field.split(".").reduce<unknown>((obj, key) => {
      if (obj && typeof obj === "object" && key in obj) return (obj as Record<string, unknown>)[key];
      return undefined;
    }, event);
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
  return { valid: missing.length === 0, missing };
}
