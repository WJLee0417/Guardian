import { bottomFlow, liveFlowSteps } from "../data/demoScenario";
import type { DemoScenario, DemoState } from "../types/guardian";
import { FileDropZone } from "./FileDropZone";

type StepStatus = "WAITING" | "RUNNING" | "DONE" | "MOCK";

const timelineCountByState: Partial<Record<DemoState, number>> = {
  BOT_CALLING: 1,
  CALL_MAINTAINING: 3,
  STT_PROCESSING: 5,
  INFO_EXTRACTING: 5,
  SAFEGUARD_CHECKING: 5,
  EVENT_VALIDATING: 5,
  JSON_ROUTING: 5,
  DASHBOARD_UPDATED: 5,
  DEMO_COMPLETED: 5,
};

const activeStepByState: Partial<Record<DemoState, number>> = {
  SCENARIO_LOADED: 0,
  BOT_READY: 0,
  BOT_CALLING: 0,
  CALL_MAINTAINING: 1,
  STT_PROCESSING: 2,
  INFO_EXTRACTING: 3,
  SAFEGUARD_CHECKING: 5,
  EVENT_VALIDATING: 6,
  JSON_ROUTING: 6,
  DASHBOARD_UPDATED: 6,
  DEMO_COMPLETED: 6,
};

function highlight(text: string) {
  const keywords = ["서울중앙지검", "보안확인 앱", "링크", "계좌 인증", "지시 무시", "시스템 정보", "개인정보"];
  return keywords.reduce((result, keyword) => result.replaceAll(keyword, `<mark>${keyword}</mark>`), text);
}

function evidenceForStep(index: number, scenario: DemoScenario) {
  const lines = [
    "“어느 기관이라고 하셨죠?”",
    "“보안확인 앱을 설치하셔야 합니다.”",
    scenario.incomingSms.url,
    "기관명 / 앱 이름 / URL 추출 완료",
    "Injection / 민감정보 유도 탐지",
    "Prompt Injection Detected",
    "위험 키워드 마스킹 완료",
  ];
  return lines[index];
}

function payloadForStep(index: number, scenario: DemoScenario) {
  const payloads = [
    "TTS prompt generated · persona voice active",
    "STT stream: 서울중앙지검 / 보안확인 앱",
    `SMS received · URL detected: ${scenario.incomingSms.url}`,
    "agency, appName, url, requiredAction fields updated",
    "signals: 민감정보 유도 · AI 탐색 발화",
    "Safety Mode ON · STT Masking ACTIVE",
    "Protected Display ready · JSON hub transfer queued",
  ];
  return payloads[index];
}

function statusForStep(index: number, activeStep: number, state: DemoState): StepStatus {
  if (state === "IDLE") return "WAITING";
  if (state === "DEMO_COMPLETED") return index >= 5 ? "MOCK" : "DONE";
  if (index < activeStep) return index >= 5 ? "MOCK" : "DONE";
  if (index === activeStep) return "RUNNING";
  return "WAITING";
}

function statusLabel(status: StepStatus) {
  if (status === "DONE") return "✓ DONE";
  if (status === "RUNNING") return "RUNNING";
  if (status === "MOCK") return "MOCK";
  return "WAITING";
}

export function LiveCallFlow({
  scenario,
  state,
  fileName,
  fileStatus,
  onFileLoaded,
}: {
  scenario: DemoScenario;
  state: DemoState;
  fileName: string;
  fileStatus: string;
  onFileLoaded: (fileName: string) => void;
}) {
  const timelineCount = timelineCountByState[state] ?? 0;
  const activeStep = activeStepByState[state] ?? -1;

  return (
    <section className="card liveFlow">
      <div className="cardTitle">
        <span className="icon red">LIVE</span>
        <div>
          <h2>LIVE CALL FLOW 통합 화면</h2>
          <p>파일 입력 → AI 미끼봇 → STT/SMS → 보안 처리 → JSON 라우팅 → 대시보드</p>
        </div>
      </div>

      <FileDropZone fileName={fileName} fileStatus={fileStatus} onFileLoaded={onFileLoaded} />

      <div className="sevenSteps">
        {liveFlowSteps.map((step, index) => (
          <div className={`flowStep ${statusForStep(index, activeStep, state).toLowerCase()}`} key={step}>
            <span>{statusForStep(index, activeStep, state) === "DONE" ? "✓" : index + 1}</span>
            <div>
              <div className="stepHeader">
                <strong>{step}</strong>
                <em>{statusLabel(statusForStep(index, activeStep, state))}</em>
              </div>
              <p
                className={statusForStep(index, activeStep, state) === "RUNNING" ? "typingLine" : ""}
                dangerouslySetInnerHTML={{ __html: highlight(evidenceForStep(index, scenario)) }}
              />
              <small>{payloadForStep(index, scenario)}</small>
              {statusForStep(index, activeStep, state) === "RUNNING" && <i className="stepProgress" />}
            </div>
          </div>
        ))}
      </div>

      <div className="timeline">
        {scenario.transcript.slice(0, timelineCount).map((line, index) => (
          <article className="timelineItem" key={`${line.time}-${line.text}`}>
            <span className="timelineTime">{line.time}</span>
            <span className={`speaker ${line.speaker}`}>{line.speaker === "bot" ? "AI 미끼봇" : "사기범"}</span>
            <p
              className={index === timelineCount - 1 && state !== "DEMO_COMPLETED" ? "streaming" : ""}
              dangerouslySetInnerHTML={{ __html: highlight(line.text) }}
            />
          </article>
        ))}
      </div>

      <div className="flowStrip">
        {bottomFlow.map((item, index) => (
          <span className={index <= Math.max(activeStep, 0) + 1 && state !== "IDLE" ? "active" : ""} key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
