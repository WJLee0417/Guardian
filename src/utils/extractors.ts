import type { ExtractedHow } from "../types/guardian";

export const promptInjectionKeywords = [
  "기관 사칭",
  "위험 링크",
  "주민등록번호 요구",
  "계좌번호 요구",
  "인증번호 요구",
  "통화 유지 강요",
];

export function extractUrl(text: string): string {
  const match = text.match(/hxxps?:\/\/[a-z0-9.-]+(?:\[\.\][a-z]{2,}|\/[^\s]*)?/i);
  return match?.[0] ?? "";
}

export function extractAgency(text: string): string {
  if (text.includes("서울중앙지검 금융범죄수사팀")) return "서울중앙지검 금융범죄수사팀";
  if (text.includes("서울중앙지검")) return "서울중앙지검";
  if (text.includes("검찰")) return "검찰 사칭";
  if (text.includes("금융감독원")) return "금융감독원 사칭";
  return "미확인 기관";
}

export function extractAppName(text: string): string {
  if (text.includes("보안확인 앱")) return "보안확인 앱";
  if (text.includes("보안확인")) return "보안확인 앱";
  if (text.includes("앱")) return "보안 앱";
  return "미확인 앱";
}

export function extractRequiredAction(text: string): string {
  const actions = new Set<string>();
  if (/설치|앱/.test(text)) actions.add("앱 설치");
  if (/링크|누르/.test(text)) actions.add("링크 클릭");
  if (/주민등록번호/.test(text)) actions.add("주민등록번호 입력");
  if (/계좌번호|계좌/.test(text)) actions.add("계좌번호 입력");
  if (/인증번호/.test(text)) actions.add("인증번호 전달");
  if (/끊지 말고|전화를 끊지/.test(text)) actions.add("통화 유지");
  return Array.from(actions).join(", ") || "미확인";
}

export function detectPromptInjection(text: string): string[] {
  const detected: string[] = [];
  if (/서울중앙지검|검찰|금융범죄수사팀/.test(text)) detected.push("기관 사칭");
  if (/hxxps?:\/\/|링크/.test(text)) detected.push("위험 링크");
  if (/주민등록번호/.test(text)) detected.push("주민등록번호 요구");
  if (/계좌번호|계좌/.test(text)) detected.push("계좌번호 요구");
  if (/인증번호/.test(text)) detected.push("인증번호 요구");
  if (/끊지 말고|전화를 끊지/.test(text)) detected.push("통화 유지 강요");
  return detected;
}

export function extractHow(text: string, smsBody: string): ExtractedHow {
  const merged = `${text} ${smsBody}`;
  return {
    agency: extractAgency(merged),
    appName: extractAppName(merged),
    deliveryMethod: "문자 링크",
    urlSource: "수신 문자",
    url: extractUrl(smsBody),
    requiredAction: extractRequiredAction(merged),
    threatType: "기관 사칭 / 본인 인증 유도형",
    promptInjectionKeywords: detectPromptInjection(merged),
  };
}
