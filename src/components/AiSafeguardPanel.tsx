import type { SafeguardResult } from "../types/guardian";
import { StatusBadge } from "./StatusBadge";

export function AiSafeguardPanel({
  rawInput,
  safeguard,
}: {
  rawInput: string;
  safeguard: SafeguardResult | null;
}) {
  return (
    <section className="card safeguard">
      <div className="cardTitle compact">
        <span className="icon red">03</span>
        <div>
          <h2>AI 자체 보안 계층</h2>
          <p>Prompt Injection 탐지, 민감정보 마스킹, Protected Display.</p>
        </div>
      </div>

      <div className="rawBox">
        <p className="label">Raw Input</p>
        <p>{rawInput || "샘플 통화와 SMS가 수신되면 원문 입력이 표시됩니다."}</p>
      </div>

      <div className="guardStatus">
        <StatusBadge variant={safeguard?.promptInjectionDetected ? "danger" : "neutral"}>
          {safeguard?.promptInjectionDetected ? "Prompt Injection Detected" : "Prompt Injection 대기"}
        </StatusBadge>
        <StatusBadge variant="success">Safety Mode ON</StatusBadge>
        <StatusBadge variant="success">Realtime STT Masking Activated</StatusBadge>
        <StatusBadge variant="success">Sensitive Info BLOCKED</StatusBadge>
        <StatusBadge variant="success">Persona Lock ENABLED</StatusBadge>
        <StatusBadge variant="danger">LLM Response RESTRICTED</StatusBadge>
      </div>

      <div className="protectedBox">
        <p className="label">Protected Display</p>
        <p>{safeguard?.maskedText ?? "보안 처리 후 STT가 여기에 표시됩니다."}</p>
      </div>

      <div className="chipRow">
        {(safeguard?.maskedKeywords ?? []).map((keyword) => (
          <span className="chip danger" key={keyword}>{keyword}</span>
        ))}
      </div>
    </section>
  );
}
