# 니짐내짐 입점센터 DID 랭킹판 — 시험판(staging, 가짜 데이터)
- 주소: `/did/<센터ID>/` (예: `did/bodyworks-gangnam/`). TV 1920×1080 전체화면, ①센터 주간 → ②전국 주간 → ③오늘 운동한 회원, 15초 순환.
- 데이터: `data/centers/<센터ID>.json`, `data/national.json` (1단계 가짜). 60초마다 다시 받고, 실패하면 직전 화면 유지.
- `hide_on_did: true` 회원은 화면에서 제외.
- 배치 규칙 정본: 디자인 시안 `_src/build.py` (shared_inbox/results/nijim_did_ranking_20261026).
- 이 저장소는 staging 브랜치만 있음. prod 없음.
