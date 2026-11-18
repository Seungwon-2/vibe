# 캐릭터 선택창 5×3 배열과 상세 미리보기 계획

## 목표

기존 선택창의 밝은 배경에 5열×3행 얼굴 목록과 선택한 한 명의 전신·이름·패시브 패널을 구현한다. 기존 순서대로 린·히요리·메리·토아·랑과 빈 슬롯 10칸을 표시한다. 첨부 이미지의 흰 틈은 실제 화면에서 비교해 일러스트 영역의 배경을 결정한다.

근거 [설계 결정서](../decisions/2026-11-18-character-select-grid-preview.md)

## 단계

| 단계 | 상태 | 범위 | 작업표 |
| --- | --- | --- | --- |
| P01 | `in_progress` | 선택창 전용 이미지 준비 → 화면 구성과 조작·브라우저 검증 | [P01](../phases/2026-11-18-character-select-grid-preview/P01-selector/phase.md) |

`project02`에서 작업별 검증과 커밋을 진행한다. 선택창 작업을 완료하면 이전 게임 화면 성능 검증 [P01-T02](../phases/2026-11-17-runner-visual-comfort/P01-comfort-and-measurement/T02-background-transition-cache.md)로 복귀한다. 실제 기기 측정은 대기 상태다.
