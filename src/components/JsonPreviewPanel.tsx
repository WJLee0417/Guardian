import type { IntelEvent } from "../types/aegis";
import { shortHash } from "../utils/hash";
import { validateIntelEvent } from "../utils/schemaValidator";
import { StatusBadge } from "./StatusBadge";

export function JsonPreviewPanel({ event }: { event: IntelEvent | null }) {
  const validation = validateIntelEvent(event);

  return (
    <section className="card jsonCard">
      <div className="cardTitle">
        <span className="icon">05</span>
        <div>
          <h2>JSON Preview / 스키마 검증</h2>
          <p>high_risk_scammer_intel_event 생성과 필수 필드 검증 결과.</p>
        </div>
      </div>

      <div className="validationRow">
        <StatusBadge variant={validation.valid ? "success" : "neutral"}>
          {validation.valid ? "Schema Validation: PASSED" : "Schema Validation 대기"}
        </StatusBadge>
        <StatusBadge variant={validation.valid ? "success" : "neutral"}>
          {validation.valid ? "Required Fields: COMPLETE" : "Required Fields 대기"}
        </StatusBadge>
        <span className="hash">payload_hash: {shortHash(event?.integrity.payload_hash)}</span>
        <span className="hash">timeline_hash: {shortHash(event?.integrity.timeline_hash)}</span>
      </div>

      <pre className="jsonPreview">{JSON.stringify(event ?? {}, null, 2)}</pre>
    </section>
  );
}
