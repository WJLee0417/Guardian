import type { IntelEvent } from "../types/aegis";
import { StatusBadge } from "./StatusBadge";

export function MockDashboard({ event }: { event: IntelEvent | null }) {
  return (
    <section className="card dashboardCard">
      <div className="cardTitle compact">
        <span className="icon dark">ADM</span>
        <div>
          <h2>관리자 대시보드</h2>
          <p>Mock Hub 이벤트 수신 후 사건 카드와 대응 상태가 갱신됩니다.</p>
        </div>
      </div>

      <div className="adminGrid">
        <div>
          <p className="label">Incident</p>
          <strong>{event?.incidentId ?? "INC-대기"}</strong>
          <span>{event?.callId ?? "CALL-대기"}</span>
        </div>
        <div>
          <p className="label">Threat Type</p>
          <strong>{event?.extractedHow.threatType ?? "-"}</strong>
          <span>{event?.extractedHow.agency ?? "기관명 대기"}</span>
        </div>
        <div>
          <p className="label">Status</p>
          <StatusBadge variant={event ? "success" : "neutral"}>{event?.status ?? "WAITING"}</StatusBadge>
        </div>
      </div>
    </section>
  );
}
