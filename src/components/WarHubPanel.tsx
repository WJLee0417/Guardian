import type { IntelEvent } from "../types/aegis";
import { StatusBadge } from "./StatusBadge";

const visibleTargets = ["MOCK_FDS", "MOCK_ASAP", "POLICE_API_MOCK", "FSS_REPORT_MOCK", "CERT_MOCK"];

export function WarHubPanel({ event }: { event: IntelEvent | null }) {
  return (
    <section className="card hubCard">
      <div className="cardTitle">
        <span className="icon red">04</span>
        <div>
          <h2>실시간 정보전 허브</h2>
          <p>고위험 이벤트를 Mock 기관 대상에 자동 라우팅합니다.</p>
        </div>
      </div>

      <div className="notice compactNotice">
        <strong>Mock 연동 고지</strong>
        <span>본 데모의 기관 연동은 실제 API가 아닌 Mock API / Demo Event입니다.</span>
      </div>

      <div className="hubStats">
        <StatusBadge variant={event ? "success" : "neutral"}>Hub Status {event ? "ACTIVE" : "READY"}</StatusBadge>
        <StatusBadge variant={event?.risk.riskLevel === "HIGH" ? "danger" : "neutral"}>
          Risk Level {event?.risk.riskLevel ?? "IDLE"}
        </StatusBadge>
        <StatusBadge variant={event ? "success" : "neutral"}>Routing {event ? "ACTIVE" : "WAITING"}</StatusBadge>
        <StatusBadge variant="mock">Mock API CONNECTED</StatusBadge>
      </div>

      <div className="routingGrid">
        {visibleTargets.map((target) => {
          const status = event?.routing[target] ?? "READY";
          return (
            <div className="routeCard" key={target}>
              <strong>{target}</strong>
              <StatusBadge variant={status === "ALERTED" ? "danger" : status === "READY" ? "neutral" : "success"}>
                {status}
              </StatusBadge>
            </div>
          );
        })}
      </div>

      <table className="logTable">
        <thead>
          <tr>
            <th>Time</th>
            <th>Target</th>
            <th>Status</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {(event?.routing_targets ?? []).map((target, index) => (
            <tr key={target}>
              <td>+{index + 1}s</td>
              <td>{target}</td>
              <td>{event?.routing[target]}</td>
              <td>Mock API / Demo Event</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
