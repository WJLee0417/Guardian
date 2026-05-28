import type { ExtractedHow, IntelEvent, RiskResult, SafeguardResult, TranscriptLine } from "../types/guardian";
import { generateHash } from "./hash";
import { resolveRoutingTargets, simulateMockApiSend } from "./routing";

export async function buildIntelEvent(data: {
  extractedHow: ExtractedHow;
  risk: RiskResult;
  safeguard: SafeguardResult;
  transcript: TranscriptLine[];
}): Promise<IntelEvent> {
  const base: IntelEvent = {
    schema: "high_risk_scammer_intel_event",
    incidentId: "INC-001",
    callId: "CALL-001",
    createdAt: new Date().toISOString(),
    source: "Guardian Demo",
    extractedHow: {
      agency: data.extractedHow.agency,
      appName: data.extractedHow.appName,
      deliveryMethod: data.extractedHow.deliveryMethod,
      urlSource: data.extractedHow.urlSource,
      url: data.extractedHow.url,
      requiredAction: data.extractedHow.requiredAction,
      threatType: data.extractedHow.threatType,
    },
    risk: data.risk,
    safeguard: {
      promptInjectionDetected: data.safeguard.promptInjectionDetected,
      sttMaskingStatus: data.safeguard.sttMaskingStatus,
      sensitiveInfoBlocked: data.safeguard.sensitiveInfoBlocked,
      personaLockStatus: data.safeguard.personaLockStatus,
      llmResponse: data.safeguard.llmResponse,
    },
    integrity: {
      payload_hash: "",
      timeline_hash: "",
    },
    routing_targets: [],
    routing: {},
    status: "DASHBOARD_UPDATED",
  };

  base.integrity.payload_hash = await generateHash(JSON.stringify({ ...base, integrity: undefined }));
  base.integrity.timeline_hash = await generateHash(JSON.stringify(data.transcript));
  base.routing_targets = resolveRoutingTargets(base);
  base.routing = simulateMockApiSend(base.routing_targets);

  return base;
}
