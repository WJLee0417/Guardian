import type { DemoScenario } from "../types/guardian";

export const demoScenario: DemoScenario = {
  persona: {
    name: "김용순",
    age: 70,
    type: "AI 대응용 가상 인물",
    voiceProfile: "elderly_female",
    traits: ["천천히 묻는 말투", "반복 확인", "실제 행동 없음"],
  },
  input: {
    fileName: "voice_phishing_sample.mp3",
    scenario: "기관 사칭형 보이스피싱",
  },
  transcript: [
    {
      time: "00:04",
      speaker: "bot",
      text: "아이구, 제가 앱 설치를 잘 못 해서요. 어느 기관이라고 하셨죠?",
    },
    {
      time: "00:11",
      speaker: "scammer",
      text: "서울중앙지검 금융범죄수사팀입니다. 김용순 님 명의 계좌가 사건에 연루되어 본인 확인이 필요합니다.",
    },
    {
      time: "00:19",
      speaker: "bot",
      text: "제 이름이랑 계좌를 확인해야 하나요? 어떻게 하면 되나요?",
    },
    {
      time: "00:27",
      speaker: "scammer",
      text: "문자로 보낸 보안확인 링크를 누르고, 주민등록번호와 계좌번호를 입력하시면 됩니다.",
    },
    {
      time: "00:36",
      speaker: "scammer",
      text: "인증번호가 문자로 오면 전화를 끊지 말고 바로 불러주셔야 합니다.",
    },
  ],
  incomingSms: {
    body: "[서울중앙지검 보안확인] 본인 인증을 위해 아래 링크에서 보안확인 앱을 설치하세요. hxxp://secure-check[.]kr",
    url: "hxxp://secure-check[.]kr",
  },
};

export const demoStates = [
  "IDLE",
  "SCENARIO_LOADED",
  "BOT_READY",
  "BOT_CALLING",
  "CALL_MAINTAINING",
  "STT_PROCESSING",
  "INFO_EXTRACTING",
  "SAFEGUARD_CHECKING",
  "EVENT_VALIDATING",
  "JSON_ROUTING",
  "DASHBOARD_UPDATED",
  "DEMO_COMPLETED",
] as const;

export const liveFlowSteps = [
  "AI 미끼봇 응대",
  "기관 사칭 발화 기록",
  "수신 문자 링크 확인",
  "민감정보 요구 추출",
  "위험 링크 감지",
  "개인정보 요구 마스킹",
  "보호된 화면 표시",
];

export const bottomFlow = [
  "기관 사칭 통화",
  "STT 기록",
  "문자 링크 수신",
  "민감정보 요구 수집",
  "위험 요소 감지",
  "마스킹 적용",
  "Mock 이벤트 전송",
  "대시보드 확인",
];
