# Guardian Demo Prototype

## 1. 프로젝트 개요

Guardian Demo Prototype은 보이스피싱 의심 통화를 실제 통화망 없이 샘플 시나리오로 재현하는 발표용 데모 앱입니다. AI 미끼봇이 사기범과 통화를 유지하고, STT/SMS 기반 정보 수집 엔진이 HOW 정보를 추출한 뒤, AI 자체 보안 계층과 표준 JSON 이벤트를 거쳐 Mock 정보전 허브와 관리자 대시보드로 전달되는 흐름을 보여줍니다.

## 2. 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 다음 주소를 엽니다.

```text
http://127.0.0.1:5173
```

프로덕션 빌드 검증:

```bash
npm run build
```

## 3. 주요 기능

- 샘플 시나리오 로드
- AI 미끼봇 실행
- 단계별 상태 머신과 자동 재생
- LIVE CALL FLOW 통합 화면
- STT 텍스트와 Incoming SMS 표시
- 정보 추출, 위험도 계산, Prompt Injection 탐지
- 민감정보 및 위험 키워드 마스킹
- 표준 JSON 이벤트 생성과 필수 필드 검증
- payload_hash, timeline_hash 생성
- Mock 라우팅과 관리자 대시보드 갱신

## 4. 데모 시나리오

샘플 시나리오는 `src/data/demoScenario.ts`에 포함되어 있습니다. 서울중앙지검 사칭, 보안확인 앱 설치 요구, 문자 링크 전달, 계좌 인증 유도, Prompt Injection 시도를 포함합니다.

## 5. 실제 구현 기능

정규식/키워드/규칙 기반으로 URL, 기관명, 앱 이름, 요구 행동을 추출합니다. 위험도 점수, Prompt Injection 감지, 마스킹, SHA-256 해시, 스키마 검증, 라우팅 대상 결정은 실제 프론트엔드 코드로 동작합니다.

## 6. Mock 처리 기능

본 데모의 기관 연동은 실제 API가 아닌 Mock API / Demo Event입니다.

- 실제 전화망 연동
- 실제 SMS망 연동
- 실제 FDS 연동
- 실제 ASAP 연동
- 실제 경찰청 API 연동
- 실제 금감원 보고
- 실제 CERT 연동
- 실제 계좌 동결 또는 거래 차단
- 실제 음성지문 모델
- 실제 고도화 음성 공격 탐지 모델

## 7. 확장 가능 기능

- 실제 STT/TTS 파이프라인 연결
- 백엔드 Mock API 서버 분리
- JSON Schema 라이브러리 기반 검증
- 관리자 대시보드 검색/필터
- 케이스별 시나리오 선택
- 기관 연동 전용 어댑터 계층

## 8. 발표 시연 순서

1. `샘플 시나리오 로드` 클릭
2. `AI 미끼봇 실행` 클릭
3. `자동 재생` 또는 `다음 단계`로 상태 진행
4. LIVE CALL FLOW에서 통화 유지와 STT/SMS 수신 설명
5. 정보 수집 엔진에서 URL, 기관명, 앱 이름, 요구 행동 확인
6. AI 자체 보안 계층에서 Prompt Injection 탐지와 마스킹 확인
7. JSON Preview에서 표준 이벤트, 스키마 검증, 해시 확인
8. Mock 정보전 허브와 관리자 대시보드 갱신 확인
