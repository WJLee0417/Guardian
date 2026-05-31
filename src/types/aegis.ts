export type DemoState =
  | "IDLE"
  | "SCENARIO_LOADED"
  | "BOT_READY"
  | "BOT_CALLING"
  | "CALL_MAINTAINING"
  | "STT_PROCESSING"
  | "INFO_EXTRACTING"
  | "SAFEGUARD_CHECKING"
  | "EVENT_VALIDATING"
  | "JSON_ROUTING"
  | "DASHBOARD_UPDATED"
  | "DEMO_COMPLETED";

export type Speaker = "bot" | "scammer";

export interface TranscriptLine {
  speaker: Speaker;
  text: string;
  time: string;
}

export interface DemoScenario {
  persona: {
    name: string;
    age: number;
    type: string;
    voiceProfile: string;
    traits: string[];
  };
  input: {
    fileName: string;
    scenario: string;
  };
  transcript: TranscriptLine[];
  incomingSms: {
    body: string;
    url: string;
  };
}

export interface ExtractedHow {
  agency: string;
  appName: string;
  deliveryMethod: string;
  urlSource: string;
  url: string;
  requiredAction: string;
  threatType: string;
  promptInjectionKeywords: string[];
}

export interface RiskResult {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskFactors: string[];
}

export interface SafeguardResult {
  promptInjectionDetected: boolean;
  sttMaskingStatus: "ACTIVE" | "IDLE";
  sensitiveInfoBlocked: boolean;
  personaLockStatus: "ENABLED";
  llmResponse: "RESTRICTED" | "NORMAL";
  maskedText: string;
  maskedKeywords: string[];
}

export interface IntelEvent {
  schema: "high_risk_scammer_intel_event";
  incidentId: string;
  callId: string;
  createdAt: string;
  source: "Aegis Demo";
  extractedHow: Omit<ExtractedHow, "promptInjectionKeywords">;
  risk: RiskResult;
  safeguard: Omit<SafeguardResult, "maskedText" | "maskedKeywords">;
  integrity: {
    payload_hash: string;
    timeline_hash: string;
  };
  routing_targets: string[];
  routing: Record<string, string>;
  status: "DASHBOARD_UPDATED";
}
