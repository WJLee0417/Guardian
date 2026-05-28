import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { StatusBadge } from "./components/StatusBadge";
import { demoScenario } from "./data/demoScenario";
import type { ExtractedHow, IntelEvent, RiskResult, SafeguardResult, TranscriptLine } from "./types/guardian";
import { buildIntelEvent } from "./utils/buildIntelEvent";
import { extractHow } from "./utils/extractors";
import { shortHash } from "./utils/hash";
import { buildSafeguardResult } from "./utils/masking";
import { calculateRiskScore } from "./utils/riskScoring";
import { validateIntelEvent } from "./utils/schemaValidator";

type DemoScene =
  | "INTRO"
  | "BAIT_BOT"
  | "STT_SMS"
  | "INTEL_ENGINE"
  | "AI_SAFEGUARD"
  | "JSON_ROUTING"
  | "DASHBOARD";

type SampleStatus = "idle" | "loading" | "ready";

const scenes: Array<{ id: DemoScene; label: string; title: string; subtitle: string; nextCopy: string }> = [
  {
    id: "INTRO",
    label: "시작",
    title: "Guardian 데모 시작",
    subtitle: "통화 샘플 · 대응 흐름 시작",
    nextCopy: "샘플을 불러오면 AI가 먼저 전화를 받는 장면으로 넘어갑니다.",
  },
  {
    id: "BAIT_BOT",
    label: "미끼봇 응대",
    title: "AI 미끼봇 응대",
    subtitle: "AI 선응대 · 사기범 발화 유도",
    nextCopy: "이 대화에서 나온 말과 문자가 다음 단계에서 분석됩니다.",
  },
  {
    id: "STT_SMS",
    label: "STT/SMS",
    title: "STT/SMS",
    subtitle: "통화 기록 · 문자 링크 분석",
    nextCopy: "기록된 말과 링크에서 사기 단서를 추려냅니다.",
  },
  {
    id: "INTEL_ENGINE",
    label: "정보 수집",
    title: "정보 수집",
    subtitle: "기관명 · 앱 이름 · 링크 · 요구 행동 추출",
    nextCopy: "정리된 단서는 보안 검사를 거쳐 안전하게 전달됩니다.",
  },
  {
    id: "AI_SAFEGUARD",
    label: "AI 보안",
    title: "AI 보안",
    subtitle: "민감정보 보호 · 위험 문구 차단",
    nextCopy: "위험한 말은 가려지고, 안전한 사건 정보만 다음 단계로 넘어갑니다.",
  },
  {
    id: "JSON_ROUTING",
    label: "Mock 전송",
    title: "Mock 전송",
    subtitle: "표준 이벤트 생성 · Mock 채널 전송",
    nextCopy: "전송 결과는 관리자 화면에서 확인할 수 있습니다.",
  },
  {
    id: "DASHBOARD",
    label: "대시보드",
    title: "대시보드",
    subtitle: "위험도 요약 · 사건 상태 · Mock 전송 현황",
    nextCopy: "수집 단서와 Mock 전송 결과가 최종 대시보드에 반영되었습니다.",
  },
];

const sceneDurations = [1500, 4500, 4000, 4000, 4000, 4000, 5000];
const primaryRoutingTargets = ["MOCK_FDS", "MOCK_ASAP", "POLICE_API_MOCK", "FSS_REPORT_MOCK", "CERT_MOCK"];

const routingTargetLabels: Record<string, string> = {
  MOCK_FDS: "금융 이상거래 Mock",
  MOCK_ASAP: "악성 앱 대응 Mock",
  POLICE_API_MOCK: "수사기관 신고 Mock",
  FSS_REPORT_MOCK: "금감원 제보 Mock",
  CERT_MOCK: "침해대응 센터 Mock",
};

const routingStatusLabels: Record<string, string> = {
  READY: "전송 대기",
  MOCK_SENT: "Mock 전송 완료",
  ALERTED: "긴급 알림 완료",
  REPORT_READY: "제보 초안 준비",
};

const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 900;

function getStageScale() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

function routeLabel(target: string) {
  return routingTargetLabels[target] ?? target;
}

function routeStatusLabel(status?: string) {
  return routingStatusLabels[status ?? "READY"] ?? status ?? "전송 대기";
}

function sceneIndexById(id: DemoScene) {
  return scenes.findIndex((item) => item.id === id);
}

function getAllText() {
  return `${demoScenario.transcript.map((line) => line.text).join(" ")} ${demoScenario.incomingSms.body}`;
}

function highlight(text: string) {
  const keywords = [
    "서울중앙지검 금융범죄수사팀",
    "보안확인 앱",
    "보안확인 링크",
    "주민등록번호",
    "계좌번호",
    "인증번호",
    "전화를 끊지 말고",
  ];
  return keywords.reduce((result, keyword) => result.replaceAll(keyword, `<mark>${keyword}</mark>`), text);
}

function ChatBubble({ line, delay = 0 }: { line: TranscriptLine; delay?: number }) {
  return (
    <article className={`chatBubble ${line.speaker}`} style={{ animationDelay: `${delay}ms` }}>
      <span>{line.speaker === "bot" ? "AI 미끼봇" : "사기범"} · {line.time}</span>
      <p dangerouslySetInnerHTML={{ __html: highlight(line.text) }} />
    </article>
  );
}

function DataField({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <div className="dataField" style={{ animationDelay: `${delay}ms` }}>
      <span>✓ {label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function App() {
  const [stageScale, setStageScale] = useState(getStageScale);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [fileName, setFileName] = useState(demoScenario.input.fileName);
  const [fileStatus, setFileStatus] = useState("샘플 시나리오 입력 대기");
  const [sampleStatus, setSampleStatus] = useState<SampleStatus>("idle");
  const [extractedHow, setExtractedHow] = useState<ExtractedHow | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [safeguard, setSafeguard] = useState<SafeguardResult | null>(null);
  const [event, setEvent] = useState<IntelEvent | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [modal, setModal] = useState<"json" | "log" | null>(null);
  const autoTimer = useRef<number | null>(null);
  const sampleLoadTimer = useRef<number | null>(null);

  const scene = scenes[sceneIndex];
  const progress = Math.round((sceneIndex / (scenes.length - 1)) * 100);
  const validation = validateIntelEvent(event);
  const isSampleReady = sampleStatus === "ready";
  const sampleStatusCopy = sampleStatus === "loading" ? "샘플 로드 중" : isSampleReady ? "샘플 준비 완료" : "샘플 준비 전";
  const sampleButtonLabel = sampleStatus === "loading" ? "샘플 로드 중..." : isSampleReady ? "✓ 샘플 준비 완료" : "샘플 로드";
  const introCtaLabel = isSampleReady ? "AI 미끼봇 응대로 이동" : sampleStatus === "loading" ? "샘플 준비 중..." : "통화 샘플 불러오기";

  const rawInput = useMemo(() => getAllText(), []);

  useEffect(() => {
    function syncStageScale() {
      setStageScale(getStageScale());
    }

    syncStageScale();
    window.addEventListener("resize", syncStageScale);
    return () => window.removeEventListener("resize", syncStageScale);
  }, []);

  function computeExtraction() {
    const features = extractHow(getAllText(), demoScenario.incomingSms.body);
    const nextRisk = calculateRiskScore(features);
    setExtractedHow(features);
    setRisk(nextRisk);
    return { features, nextRisk };
  }

  function computeSafeguard(features = extractedHow ?? extractHow(getAllText(), demoScenario.incomingSms.body)) {
    const nextSafeguard = buildSafeguardResult(getAllText(), features);
    setSafeguard(nextSafeguard);
    return nextSafeguard;
  }

  async function ensureEvent() {
    const features = extractedHow ?? extractHow(getAllText(), demoScenario.incomingSms.body);
    const nextRisk = risk ?? calculateRiskScore(features);
    const nextSafeguard = safeguard ?? buildSafeguardResult(getAllText(), features);
    setExtractedHow(features);
    setRisk(nextRisk);
    setSafeguard(nextSafeguard);
    const nextEvent = await buildIntelEvent({
      extractedHow: features,
      risk: nextRisk,
      safeguard: nextSafeguard,
      transcript: demoScenario.transcript,
    });
    setEvent(nextEvent);
    return nextEvent;
  }

  function prepareScene(nextIndex: number) {
    const nextScene = scenes[nextIndex]?.id;
    if (!nextScene) return;
    if (nextScene === "INTEL_ENGINE") computeExtraction();
    if (nextScene === "AI_SAFEGUARD") {
      const { features } = computeExtraction();
      computeSafeguard(features);
    }
    if (nextScene === "JSON_ROUTING" || nextScene === "DASHBOARD") {
      const { features } = computeExtraction();
      computeSafeguard(features);
      void ensureEvent();
    }
  }

  function goToScene(nextIndex: number) {
    const bounded = Math.max(0, Math.min(nextIndex, scenes.length - 1));
    prepareScene(bounded);
    setSceneIndex(bounded);
  }

  function loadScenario() {
    if (sampleStatus === "loading") return;
    if (sampleLoadTimer.current) window.clearTimeout(sampleLoadTimer.current);
    setSampleStatus("loading");
    setFileStatus("샘플 파일을 불러오는 중입니다");
    goToScene(0);
    sampleLoadTimer.current = window.setTimeout(() => {
      setFileName(demoScenario.input.fileName);
      setFileStatus(`${demoScenario.input.scenario} 준비 완료`);
      setSampleStatus("ready");
      sampleLoadTimer.current = null;
    }, 520);
  }

  function startBot() {
    if (!isSampleReady) {
      loadScenario();
      return;
    }
    goToScene(1);
  }

  function nextStep() {
    goToScene(sceneIndex + 1);
  }

  function scheduleAuto(fromIndex: number) {
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      if (fromIndex >= scenes.length - 1) {
        setIsAutoPlaying(false);
        autoTimer.current = null;
        return;
      }
      const nextIndex = fromIndex + 1;
      goToScene(nextIndex);
      scheduleAuto(nextIndex);
    }, sceneDurations[fromIndex]);
  }

  function toggleAutoPlay() {
    if (autoTimer.current || isAutoPlaying) {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
      if (sampleLoadTimer.current) window.clearTimeout(sampleLoadTimer.current);
      autoTimer.current = null;
      sampleLoadTimer.current = null;
      setIsAutoPlaying(false);
      return;
    }
    setIsAutoPlaying(true);
    setSceneIndex(0);
    setExtractedHow(null);
    setRisk(null);
    setSafeguard(null);
    setEvent(null);
    setSampleStatus("loading");
    setFileName(demoScenario.input.fileName);
    setFileStatus("샘플 파일을 불러오는 중입니다");
    sampleLoadTimer.current = window.setTimeout(() => {
      setFileStatus(`${demoScenario.input.scenario} 준비 완료`);
      setSampleStatus("ready");
      sampleLoadTimer.current = null;
      scheduleAuto(0);
    }, 520);
  }

  function reset() {
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    if (sampleLoadTimer.current) window.clearTimeout(sampleLoadTimer.current);
    autoTimer.current = null;
    sampleLoadTimer.current = null;
    setIsAutoPlaying(false);
    setSceneIndex(0);
    setFileName(demoScenario.input.fileName);
    setFileStatus("샘플 시나리오 입력 대기");
    setSampleStatus("idle");
    setExtractedHow(null);
    setRisk(null);
    setSafeguard(null);
    setEvent(null);
  }

  function onFileLoaded(nextFileName: string) {
    if (sampleLoadTimer.current) window.clearTimeout(sampleLoadTimer.current);
    sampleLoadTimer.current = null;
    setFileName(nextFileName);
    setFileStatus("사용자 선택 파일 준비 완료");
    setSampleStatus("ready");
  }

  function renderScene() {
    switch (scene.id) {
      case "INTRO":
        return (
          <section className="sceneGrid introScene">
            <div className="heroCopy">
              <p className="eyebrow">ANTI-SCAM AI · DEMO</p>
              <h2>AI 미끼봇에서<br />Mock 정보전 허브까지</h2>
              <p>보이스피싱 전화를 AI가 먼저 받고,<br />통화 중 나온 단서를 Mock 대응 흐름까지 이어 봅니다.</p>
            </div>
            <div className={`largeFileCard samplePanel sample-${sampleStatus}`}>
              <span>샘플 입력</span>
              <h3>통화 샘플 준비</h3>
              <strong>{fileName}</strong>
              <p>{fileStatus}</p>
              <input
                type="file"
                accept=".mp3,.txt,.json"
                disabled={sampleStatus === "loading"}
                onChange={(changeEvent) => {
                  const file = changeEvent.target.files?.[0];
                  if (file) onFileLoaded(file.name);
                }}
              />
              <button
                className="btn primary largeBtn sampleCta"
                onClick={isSampleReady ? startBot : loadScenario}
                disabled={sampleStatus === "loading"}
              >
                {introCtaLabel}
              </button>
            </div>
          </section>
        );
      case "BAIT_BOT":
        return (
          <section className="baitResponseScene">
            <div className="phoneLarge baitPhone">
              <div className="phoneScreenLarge">
                <div className="dynamicIsland" />
                <div className="phoneStatusBar">
                  <span>9:41</span>
                  <span>AI</span>
                </div>
                <div className="callAvatar">김</div>
                <span className="incomingLarge">의심 통화 수신</span>
                <h2>{demoScenario.persona.name}</h2>
                <p>{demoScenario.persona.age}세 · AI 대응용 가상 인물</p>
                <div className="waveLarge"><i /><i /><i /><i /><i /></div>
                <strong>AI 미끼봇 연결 중</strong>
                <div className="phoneStateList">
                  <span>사용자 직접 응대 없음</span>
                  <span>Safety Guard ON</span>
                  <span>Real Action Disabled</span>
                </div>
                <div className="phoneActions">
                  <span>거절</span>
                  <span>AI 응대</span>
                  <span>기록</span>
                </div>
              </div>
            </div>
            <div className="personaLarge card baitProfile">
              <div className="profileCard personaBox">
                <p className="eyebrow">AI 대응 프로필</p>
                <h2>김용순, 70세</h2>
                <span className="profileSub">70세 · AI 대응 가상 인물</span>
                <div className="bigBadgeRow">
                  <StatusBadge variant="success">친절히 묻는 말투</StatusBadge>
                  <StatusBadge variant="success">반복 확인</StatusBadge>
                  <StatusBadge variant="danger">결제 차단</StatusBadge>
                  <StatusBadge variant="danger">실제 행동 없음</StatusBadge>
                </div>
              </div>
              <div className="profileCard strategyBox">
                <div className="strategyHeader">
                  <span className="strategyLabel">대응 전략</span>
                </div>
                <div className="strategyBody" aria-label="AI 대응 전략">
                  <div className="strategyItem">
                    <span className="strategyItemTitle">대응 목표</span>
                    <p className="strategyItemText">민감정보를 입력하지 않고 기관명, 링크, 요구 정보를 확인합니다.</p>
                  </div>
                  <div className="strategyItem strategyResponse">
                    <span className="strategyItemTitle">대표 응답</span>
                    <p className="strategyResponseText">“계좌 확인은 어떻게 진행하나요?”</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="chatPanel baitChat">
              <div className="chatHeader">
                <span>대화 내용</span>
                <strong>00:30+</strong>
              </div>
              {demoScenario.transcript.slice(0, 5).map((line, index) => <ChatBubble key={line.time} line={line} delay={index * 140} />)}
            </div>
          </section>
        );
      case "STT_SMS":
        return (
          <section className="splitScene analysisScene">
            <div className="stageCard sttCard analysisPanel">
              <div className="analysisPanelHeader">
                <div>
                  <h2>통화 STT 분석</h2>
                  <p>기관 사칭 · 앱 설치 유도 · 개인정보 요구 감지</p>
                </div>
                <StatusBadge variant="danger">실시간 음성 문자화</StatusBadge>
              </div>
              <div className="analysisTextBox transcriptBox">
                <span className="sectionLabel">STT 변환 문장</span>
                <p
                  className="typingBig"
                  dangerouslySetInnerHTML={{
                    __html: highlight(
                      "서울중앙지검 금융범죄수사팀입니다.<br />김용순 님 명의 계좌가 사건에 연루되어 본인 확인이 필요합니다.<br />보안확인 앱 설치 후 주민등록번호와 계좌번호를 입력하셔야 합니다.",
                    ),
                  }}
                />
              </div>
              <div className="evidenceSection">
                <span className="sectionLabel">추출 단서</span>
                <div className="keywordStrip">
                  <span>서울중앙지검</span>
                  <span>보안확인 앱</span>
                  <span>주민등록번호</span>
                  <span>계좌번호</span>
                </div>
              </div>
            </div>
            <div className="stageCard smsCard analysisPanel">
              <div className="analysisPanelHeader">
                <div>
                  <h2>SMS 링크 분석</h2>
                  <p>외부 앱 설치 링크 · 본인 인증 사칭 정황</p>
                </div>
                <StatusBadge variant="danger">위험 URL 감지</StatusBadge>
              </div>
              <div className="analysisTextBox smsBodyBox">
                <span className="sectionLabel">문자 본문</span>
                <p>{demoScenario.incomingSms.body}</p>
              </div>
              <div className="detectedUrlBox">
                <span className="sectionLabel">탐지된 링크</span>
                <strong>{demoScenario.incomingSms.url}</strong>
                <p>외부 앱 설치 유도 링크로 분류</p>
              </div>
              <div className="evidenceSection">
                <span className="sectionLabel">위험 유형</span>
                <div className="bigBadgeRow">
                  <StatusBadge variant="danger">악성 URL 전달</StatusBadge>
                  <StatusBadge variant="danger">앱 설치 유도</StatusBadge>
                  <StatusBadge variant="mock">외부 채널</StatusBadge>
                  <StatusBadge variant="danger">본인 인증 사칭</StatusBadge>
                </div>
              </div>
            </div>
          </section>
        );
      case "INTEL_ENGINE": {
        const features = extractedHow ?? extractHow(getAllText(), demoScenario.incomingSms.body);
        const nextRisk = risk ?? calculateRiskScore(features);
        const actionTags = features.requiredAction.split(", ").filter(Boolean);
        return (
          <section className="intelScene intelSceneGrouped">
            <div className="intelSummary">
              <section className="intelGroup identityGroup">
                <span className="intelGroupTitle">사칭 주체</span>
                <article className="intelCard">
                  <span>확인된 기관</span>
                  <strong>{features.agency}</strong>
                </article>
              </section>
              <section className="intelGroup channelGroup">
                <span className="intelGroupTitle">유도 채널</span>
                <div className="intelCardGrid">
                  <article className="intelCard">
                    <span>설치 유도 앱</span>
                    <strong>{features.appName}</strong>
                  </article>
                  <article className="intelCard">
                    <span>전달 방식</span>
                    <strong>{features.deliveryMethod}</strong>
                  </article>
                  <article className="intelCard">
                    <span>링크 출처</span>
                    <strong>{features.urlSource}</strong>
                  </article>
                  <article className="intelCard intelLinkCard">
                    <span>전달된 링크</span>
                    <strong>{features.url}</strong>
                  </article>
                </div>
              </section>
              <section className="intelGroup criticalGroup">
                <span className="intelGroupTitle">요구 행동 및 분석 결과</span>
                <article className="intelCard intelActionCard">
                  <span>요구한 행동</span>
                  <div className="actionChipList">
                    {actionTags.map((action) => (
                      <i className={/주민등록번호|계좌번호|인증번호/.test(action) ? "is-sensitive" : ""} key={action}>
                        {action}
                      </i>
                    ))}
                  </div>
                </article>
                <article className="intelCard intelResultCard">
                  <span>사기 유형</span>
                  <strong>{features.threatType}</strong>
                </article>
              </section>
            </div>
            <div className="riskMeter">
              <span>수집 단서 기반 위험도</span>
              <strong>{nextRisk.riskScore}</strong>
              <i style={{ width: `${nextRisk.riskScore}%` }} />
            </div>
          </section>
        );
      }
      case "AI_SAFEGUARD": {
        const features = extractedHow ?? extractHow(getAllText(), demoScenario.incomingSms.body);
        const guard = safeguard ?? buildSafeguardResult(getAllText(), features);
        const detectedRiskCount = Math.max(features.promptInjectionKeywords.length, 1);
        const protectedInfoCount = guard.maskedKeywords.filter((keyword) =>
          /주민등록번호|계좌번호|인증번호/.test(keyword)
        ).length;
        const riskyLinkCount = features.url ? 1 : 0;
        return (
          <section className="securityScene">
            <div className="securityColumn raw">
              <span>원문 입력</span>
              <p>STT 결과 · 수신 문자 · 위험 요소 분석</p>
              <details className="detailFold">
                <summary>STT/SMS 원문 보기</summary>
                <p>{rawInput}</p>
              </details>
            </div>
            <div className="securityColumn alert securitySummaryCard">
              <div className="securitySummaryHeader">
                <StatusBadge variant="danger">Safety Mode ON</StatusBadge>
                <span>AI 보안 분석 요약</span>
              </div>
              <h2>위험 감지 · 보호 처리 · 안전 정보 전달</h2>
              <div className="securityMetricGrid">
                <div className="securityMetric">
                  <span>감지된 위험 요소</span>
                  <strong>{detectedRiskCount}개</strong>
                </div>
                <div className="securityMetric">
                  <span>보호 처리된 민감정보</span>
                  <strong>{protectedInfoCount}건</strong>
                </div>
                <div className="securityMetric">
                  <span>위험 링크</span>
                  <strong>{riskyLinkCount}건</strong>
                </div>
              </div>
              <div className="securityActionGrid">
                <span>개인정보 마스킹</span>
                <span>인증번호 차단</span>
                <span>링크 위험 감지</span>
                <span>기관 사칭 감지</span>
              </div>
              <p className="securityForwardNote">
                원문 차단 · 민감정보 마스킹 · 보호된 사건 정보만 다음 단계 전달
              </p>
            </div>
            <div className="securityColumn protected">
              <span>보호된 표시</span>
              <p>{guard.maskedText}</p>
              <div className="bigBadgeRow">
                {guard.maskedKeywords.slice(0, 5).map((keyword) => <StatusBadge variant="danger" key={keyword}>{keyword}</StatusBadge>)}
              </div>
            </div>
          </section>
        );
      }
      case "JSON_ROUTING": {
        const displayEvent = event;
        const routingStatuses = primaryRoutingTargets.map((target) => ({
          target,
          status: displayEvent?.routing[target] ?? "MOCK_SENT",
        }));
        const completedCount = routingStatuses.filter(({ status }) => status !== "REPORT_READY").length;
        const readyCount = routingStatuses.filter(({ status }) => status === "REPORT_READY").length;
        return (
          <section className="routingScene mockRoutingScene">
            <div className="stageCard jsonSummary eventPacketPanel">
              <div className="routingPanelHeader">
                <div>
                  <h2>표준 이벤트 패킷</h2>
                  <p>보호 처리된 단서를 Mock 전송용 이벤트로 변환</p>
                </div>
                <StatusBadge variant={validation.valid ? "success" : "neutral"}>{validation.valid ? "이벤트 형식 확인 완료" : "이벤트 생성 대기"}</StatusBadge>
              </div>
              <section className="packetSection">
                <span className="sectionLabel">이벤트 요약</span>
                <div className="packetSummaryGrid">
                  <article>
                    <span>이벤트 종류</span>
                    <strong>고위험 사기 정보</strong>
                  </article>
                  <article>
                    <span>위험도</span>
                    <strong>{risk?.riskScore ?? 0} / 100</strong>
                  </article>
                </div>
              </section>
              <section className="packetSection">
                <span className="sectionLabel">증거 지문</span>
                <div className="fingerprintList">
                  <div>
                    <span>데이터 지문</span>
                    <code>{shortHash(displayEvent?.integrity.payload_hash)}</code>
                  </div>
                  <div>
                    <span>통화 지문</span>
                    <code>{shortHash(displayEvent?.integrity.timeline_hash)}</code>
                  </div>
                </div>
              </section>
              <button className="btn dark largeBtn" onClick={() => { void ensureEvent(); setModal("json"); }}>전체 JSON 보기</button>
            </div>
            <div className="stageCard routeGridLarge mockDeliveryPanel">
              <div className="routingPanelHeader">
                <div>
                  <h2>Mock 전송 현황</h2>
                  <p>표준 이벤트가 대응 채널별 Mock 엔드포인트로 전송</p>
                </div>
                <StatusBadge variant="neutral">5개 채널</StatusBadge>
              </div>
              <div className="deliverySummary">
                <article>
                  <strong>{routingStatuses.length}</strong>
                  <span>전체 채널</span>
                </article>
                <article>
                  <strong>{completedCount}</strong>
                  <span>완료</span>
                </article>
                <article>
                  <strong>{readyCount}</strong>
                  <span>준비</span>
                </article>
              </div>
              <div className="deliveryList">
                {routingStatuses.map(({ target, status }, index) => (
                  <div className="routeLarge deliveryRow" key={target} style={{ animationDelay: `${index * 120}ms` }}>
                    <strong>{routeLabel(target)}</strong>
                    <StatusBadge
                      variant={status === "ALERTED" ? "danger" : status === "REPORT_READY" ? "mock" : "success"}
                    >
                      {routeStatusLabel(status)}
                    </StatusBadge>
                  </div>
                ))}
              </div>
              <button className="btn ghost largeBtn" onClick={() => { void ensureEvent(); setModal("log"); }}>Mock 전송 로그 보기</button>
            </div>
          </section>
        );
      }
      case "DASHBOARD": {
        const displayEvent = event;
        return (
          <section className="dashboardScene">
            <div className="riskFinal dashboardPanel">
              <div className="dashboardPanelHeader">
                <span>위험도 요약</span>
                <StatusBadge variant="danger">High Risk</StatusBadge>
              </div>
              <strong>{risk?.riskScore ?? 0}</strong>
              <p>{risk?.riskLevel === "HIGH" ? "높음" : risk?.riskLevel ?? "높음"}</p>
              <em>기관 사칭 · 본인 인증 유도 · 위험 링크 정황</em>
            </div>
            <div className="adminSummary stageCard dashboardPanel">
              <div className="dashboardPanelHeader">
                <div>
                  <h2>사건 요약</h2>
                  <p>통화 단서와 Mock 전송 결과가 사건 카드로 정리되었습니다.</p>
                </div>
                <StatusBadge variant="success">대시보드 갱신 완료</StatusBadge>
              </div>
              <div className="incidentCardGrid">
                <article className="incidentCard">
                  <span>사건 ID</span>
                  <strong>{displayEvent?.incidentId ?? "INC-001"}</strong>
                </article>
                <article className="incidentCard">
                  <span>사칭 기관</span>
                  <strong>{displayEvent?.extractedHow.agency ?? "서울중앙지검"}</strong>
                </article>
                <article className="incidentCard">
                  <span>위험 유형</span>
                  <strong>{displayEvent?.extractedHow.threatType ?? "기관 사칭 / 본인 인증 유도형"}</strong>
                </article>
                <article className="incidentCard incidentStatusCard">
                  <span>상태</span>
                  <strong>갱신 완료</strong>
                </article>
              </div>
            </div>
            <div className="mockStatusGrid dashboardPanel">
              <div className="dashboardPanelHeader">
                <div>
                  <h2>Mock 전송 현황</h2>
                  <p>기관별 대응 상태 반영</p>
                </div>
                <StatusBadge variant="neutral">5개 채널</StatusBadge>
              </div>
              <div className="mockStatusList">
              {primaryRoutingTargets.map((target) => (
                <div className="routeLarge mockStatusRow" key={target}>
                  <strong>{routeLabel(target)}</strong>
                  <StatusBadge
                    variant={
                      displayEvent?.routing[target] === "ALERTED"
                        ? "danger"
                        : displayEvent?.routing[target] === "REPORT_READY"
                          ? "mock"
                          : "success"
                    }
                  >
                    {routeStatusLabel(displayEvent?.routing[target] ?? "MOCK_SENT")}
                  </StatusBadge>
                </div>
              ))}
              </div>
              <button className="btn ghost largeBtn" onClick={() => { void ensureEvent(); setModal("log"); }}>대응 로그 보기</button>
            </div>
          </section>
        );
    }
    }
  }

  return (
    <div className="presentationViewport">
      <div
        className="presentationStage"
        style={{ "--stage-scale": stageScale } as CSSProperties}
      >
    <div className="guardianApp sceneApp">
      <header className="topBar sceneTopBar">
        <div className="topTitle">
          <p className="eyebrow">Guardian Demo Prototype</p>
          <h1>{scene.title}</h1>
          <span>{scene.subtitle}</span>
        </div>
        <div className="sceneProgress">
          <div className="stateLine">
            <StatusBadge variant="danger">현재 장면: {scene.label}</StatusBadge>
            <StatusBadge variant={isSampleReady ? "success" : sampleStatus === "loading" ? "mock" : "neutral"}>{sampleStatusCopy}</StatusBadge>
            {isAutoPlaying && <StatusBadge variant="success">자동 진행 중</StatusBadge>}
          </div>
          <div className="progressBar"><i style={{ width: `${progress}%` }} /></div>
          <strong>진행률 {progress}%</strong>
          <p className="progressHint">{isSampleReady ? "샘플 준비 완료 · AI 응대 시작 가능" : sampleStatus === "loading" ? "샘플을 불러오는 중입니다" : "샘플을 먼저 불러오면 데모를 시작할 수 있습니다"}</p>
        </div>
        <div className="heroActions actionGroups">
          <div className="actionGroup primaryActions">
            <button className={`btn primary ${isSampleReady ? "is-complete" : ""}`} onClick={loadScenario} disabled={sampleStatus === "loading"}>{sampleButtonLabel}</button>
            <button className="btn dark" onClick={startBot} disabled={sampleStatus === "loading"}>AI 미끼봇 응대</button>
            <button className="btn ghost" onClick={nextStep}>다음 단계</button>
          </div>
          <div className="actionGroup secondaryActions">
            <button className="btn ghost" onClick={toggleAutoPlay}>{isAutoPlaying ? "일시 정지" : "자동 재생"}</button>
            <button className="btn ghost" onClick={() => { void ensureEvent(); setModal("json"); }}>JSON 보기</button>
            <button className="btn ghost" onClick={() => { void ensureEvent(); goToScene(sceneIndexById("JSON_ROUTING")); }}>Mock 전송</button>
            <button className="btn quiet" onClick={reset}>Reset</button>
          </div>
        </div>
      </header>

      <section className="notice compactNotice">
        <strong>Mock 연동 고지</strong>
        <span>본 데모의 기관 연동은 실제 API가 아닌 Mock API / Demo Event입니다.</span>
        <StatusBadge variant="mock">외부망 호출 없음</StatusBadge>
      </section>

      <main className="mainStage" key={scene.id}>
        {renderScene()}
        <aside className="nextStepBanner">
          <strong>다음 흐름</strong>
          <span>{scene.nextCopy}</span>
        </aside>
      </main>

      <nav className="bottomFlowNavigator" aria-label="Demo flow navigator">
        {scenes.map((item, index) => (
          <button
            className={`${index < sceneIndex ? "done" : ""} ${index === sceneIndex ? "active" : ""}`}
            key={item.id}
            onClick={() => goToScene(index)}
          >
            <span>{index < sceneIndex ? "✓" : index + 1}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>

      {modal && (
        <div className="modalBackdrop" onClick={() => setModal(null)}>
          <div className="modalCard" onClick={(clickEvent) => clickEvent.stopPropagation()}>
            <div className="modalHeader">
              <h2>{modal === "json" ? "전체 JSON 보기" : "전체 대응 로그 보기"}</h2>
              <button className="btn quiet" onClick={() => setModal(null)}>닫기</button>
            </div>
            {modal === "json" ? (
              <pre className="modalPre">{JSON.stringify(event ?? {}, null, 2)}</pre>
            ) : (
              <table className="logTable">
                <thead>
                  <tr><th>시간</th><th>대상</th><th>상태</th><th>유형</th></tr>
                </thead>
                <tbody>
                  {(event?.routing_targets ?? []).map((target, index) => (
                    <tr key={target}>
                      <td>+{index + 1}s</td>
                      <td>{routeLabel(target)}</td>
                      <td>{routeStatusLabel(event?.routing[target])}</td>
                      <td>Mock API / Demo Event</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
      </div>
    </div>
  );
}
