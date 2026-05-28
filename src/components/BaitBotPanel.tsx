import type { DemoScenario, DemoState } from "../types/guardian";
import { StatusBadge } from "./StatusBadge";

export function BaitBotPanel({ scenario, state }: { scenario: DemoScenario; state: DemoState }) {
  const active = state !== "IDLE";
  const duration = state === "IDLE" ? "00:00" : state === "SCENARIO_LOADED" ? "00:10" : "00:30+";

  return (
    <aside className="card baitCard">
      <div className="cardTitle">
        <span className="icon red">01</span>
        <div>
          <h2>AI 미끼봇</h2>
          <p>사기범과 통화를 유지하며 HOW 정보 노출을 유도합니다.</p>
        </div>
      </div>

      <div className="phoneMock">
        <div className="phoneTop" />
        <div className="callScreen">
          <p className="incoming">의심 통화 수신</p>
          <h3>{scenario.persona.name}</h3>
          <p className="phoneSub">{scenario.persona.type} · {scenario.persona.age}세</p>
          <div className={`wave ${active ? "running" : ""}`} aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="callDuration">{duration}</div>
        </div>
      </div>

      <div className="personaCard">
        <div>
          <p className="label">Persona</p>
          <h3>{scenario.persona.name}</h3>
          <p>{scenario.persona.age}세 · {scenario.persona.type} · {scenario.persona.voiceProfile}</p>
        </div>
        <StatusBadge variant={active ? "success" : "neutral"}>{active ? "ACTIVE" : "READY"}</StatusBadge>
      </div>

      <div className="chipRow">
        {scenario.persona.traits.map((trait) => <span className="chip" key={trait}>{trait}</span>)}
      </div>

      <div className="statusGrid">
        <span>Bot Status <b>{state}</b></span>
        <span>Persona <b>ACTIVE</b></span>
        <span>Payment <b className="redText">BLOCKED</b></span>
        <span>Real Action <b className="redText">DISABLED</b></span>
        <span>Safety Guard <b>ON</b></span>
        <span>TTS 유도발화 <b>READY</b></span>
      </div>
    </aside>
  );
}
