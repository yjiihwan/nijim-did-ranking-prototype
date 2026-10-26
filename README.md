# 니짐내짐 입점센터 DID 랭킹판 — 시험판(staging, 가짜 데이터)
- 주소: `/did/<센터ID>/` (예: `did/bodyworks-gangnam/`). TV 1920×1080 전체화면, ①센터 주간 → ②전국 주간 → ③오늘 운동한 회원, 15초 순환.
- 데이터: `data/centers/<센터ID>.json`(센터·QR·오늘), `data/center_week.json`(이번 주 세션 행), `data/national.json` (1단계 가짜). 60초마다 다시 받고, 실패하면 직전 화면 유지.
- 결정 40: ① 센터 순위 = `center_rank.js` `CenterRank.centerBoard` — 그 센터 입장(V1) 세션으로 번 주간 경험치만(앱 «내 센터» 탭과 같은 파일). 여러 센터 회원은 센터마다 그 센터 몫만.
- `hide_in_center_ranking: true`(«센터 랭킹에 안 보이기», 옛 `hide_on_did`) 회원은 ①②③ 모든 화면에서 제외(③ 인원 숫자엔 포함).
- 가짜 데이터 다시 만들기: `python3 tools/build_week_data.py site` (원본 `_bak_data_before_d40/`).
- 배치 규칙 정본: 디자인 시안 `_src/build.py` (shared_inbox/results/nijim_did_ranking_20261026).
- 이 저장소는 staging 브랜치만 있음. prod 없음.
