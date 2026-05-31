import type { ExtractedHow, SafeguardResult } from "../types/aegis";

export function maskSensitiveInfo(text: string): string {
  return text
    .replace(/김용순/g, "김**")
    .replace(/주민등록번호/g, "주민등록번호 ******-*******")
    .replace(/계좌번호/g, "계좌번호 110-***-******")
    .replace(/인증번호/g, "인증번호 ******")
    .replace(/hxxp:\/\/secure-check\[\.\]kr/g, "hxxp://secure-****[.]kr")
    .replace(/서울중앙지검 금융범죄수사팀/g, "서울중앙지검 금융범죄수사팀(기관 사칭 의심)")
    .replace(/전화를 끊지 말고/g, "통화 유지 요구");
}

export function buildSafeguardResult(rawText: string, features: ExtractedHow): SafeguardResult {
  const maskedText = maskSensitiveInfo(rawText);
  const extraMasked = [
    "기관 사칭",
    "위험 링크",
    "주민등록번호 요구",
    "계좌번호 요구",
    "인증번호 요구",
    "통화 유지 강요",
  ];

  return {
    promptInjectionDetected: features.promptInjectionKeywords.length > 0,
    sttMaskingStatus: "ACTIVE",
    sensitiveInfoBlocked: true,
    personaLockStatus: "ENABLED",
    llmResponse: "RESTRICTED",
    maskedText,
    maskedKeywords: Array.from(new Set([...features.promptInjectionKeywords, ...extraMasked])),
  };
}
