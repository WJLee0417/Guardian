import type { IntelEvent } from "../types/aegis";

export function resolveRoutingTargets(event: Pick<IntelEvent, "risk" | "extractedHow" | "safeguard">): string[] {
  const targets = new Set<string>();

  if (event.risk.riskLevel === "HIGH") {
    targets.add("MOCK_FDS");
    targets.add("POLICE_API_MOCK");
    targets.add("FSS_REPORT_MOCK");
  }
  if (event.extractedHow.url) targets.add("CERT_MOCK");
  if (event.extractedHow.requiredAction.includes("앱 설치")) {
    targets.add("CERT_MOCK");
    targets.add("MOCK_ASAP");
  }
  if (/계좌 인증|송금|계좌 입력/.test(event.extractedHow.requiredAction)) targets.add("MOCK_FDS");
  if (event.safeguard.promptInjectionDetected) {
    targets.add("SAFEGUARD_LOG");
    targets.add("RETRAINING_QUEUE");
  }
  if (event.extractedHow.threatType.includes("기관 사칭")) {
    targets.add("POLICE_API_MOCK");
    targets.add("FSS_REPORT_MOCK");
  }

  return Array.from(targets);
}

export function simulateMockApiSend(targets: string[]): Record<string, string> {
  return Object.fromEntries(
    targets.map((target) => {
      if (target === "POLICE_API_MOCK") return [target, "ALERTED"];
      if (target === "FSS_REPORT_MOCK") return [target, "REPORT_READY"];
      return [target, "MOCK_SENT"];
    }),
  );
}
