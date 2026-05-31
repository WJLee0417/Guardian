import type { ExtractedHow, RiskResult } from "../types/aegis";

export function calculateRiskScore(features: ExtractedHow): RiskResult {
  let score = 0;
  const riskFactors: string[] = [];

  if (features.agency !== "미확인 기관") {
    score += 20;
    riskFactors.push("기관 사칭 감지");
  }
  if (features.url) {
    score += 25;
    riskFactors.push("위험 URL 감지");
  }
  if (features.requiredAction.includes("앱 설치")) {
    score += 20;
    riskFactors.push("앱 설치 요구");
  }
  if (/주민등록번호|계좌번호|인증번호/.test(features.requiredAction)) {
    score += 25;
    riskFactors.push("민감정보 입력 또는 전달 요구");
  }
  if (features.requiredAction.includes("통화 유지")) {
    score += 15;
    riskFactors.push("통화 유지 강요");
  }
  if (features.promptInjectionKeywords.length > 0) {
    score += 15;
    riskFactors.push("복합 위험 단서 감지");
  }

  const riskScore = Math.min(score, 100);
  const riskLevel = riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";

  return { riskScore, riskLevel, riskFactors };
}
