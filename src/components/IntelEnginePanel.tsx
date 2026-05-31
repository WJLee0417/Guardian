import type { DemoScenario, ExtractedHow, RiskResult } from "../types/aegis";
import { StatusBadge } from "./StatusBadge";

export function IntelEnginePanel({
  scenario,
  extractedHow,
  risk,
  active,
}: {
  scenario: DemoScenario;
  extractedHow: ExtractedHow | null;
  risk: RiskResult | null;
  active: boolean;
}) {
  const rows = [
    ["기관명", extractedHow?.agency ?? "-"],
    ["앱 이름", extractedHow?.appName ?? "-"],
    ["전달 방식", extractedHow?.deliveryMethod ?? "-"],
    ["URL 출처", extractedHow?.urlSource ?? "-"],
    ["URL", extractedHow?.url ?? "-"],
    ["요구 행동", extractedHow?.requiredAction ?? "-"],
    ["분류", extractedHow?.threatType ?? "-"],
  ];

  return (
    <section className="card">
      <div className="cardTitle compact">
        <span className="icon">02</span>
        <div>
          <h2>사기범 정보 수집 엔진</h2>
          <p>STT와 SMS에서 URL, 기관명, 앱 이름, 요구 행동을 추출합니다.</p>
        </div>
      </div>

      <div className="twoPanel">
        <div className="sttPanel">
          <p className="label">STT LIVE</p>
          <p>{active ? "사기범 발화 수신 및 키워드 하이라이트 중" : "STT 대기"}</p>
          <StatusBadge variant={active ? "success" : "neutral"}>{active ? "LIVE" : "READY"}</StatusBadge>
        </div>
        <div className="smsPanel">
          <p className="label">Incoming SMS</p>
          <p>{active ? scenario.incomingSms.body : "문자 이벤트 대기"}</p>
          <div className="badgeLine">
            <StatusBadge variant={active ? "danger" : "neutral"}>{active ? "악성 URL 의심" : "URL 대기"}</StatusBadge>
            <StatusBadge variant={active ? "mock" : "neutral"}>외부 채널</StatusBadge>
          </div>
        </div>
      </div>

      <dl className="kvTable">
        {rows.map(([key, value]) => (
          <div className="kvRow" key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="riskCard">
        <div>
          <p className="label">Risk Score</p>
          <strong>{risk ? `${risk.riskScore} / 100` : "0 / 100"}</strong>
        </div>
        <StatusBadge variant={risk?.riskLevel === "HIGH" ? "danger" : "neutral"}>{risk?.riskLevel ?? "IDLE"}</StatusBadge>
      </div>
    </section>
  );
}
