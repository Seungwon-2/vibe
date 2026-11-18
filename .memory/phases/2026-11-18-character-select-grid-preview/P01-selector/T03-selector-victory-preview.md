# T03 선택한 캐릭터의 승리 모션

## Status: done

## 목표

오른쪽 상세 패널에서 선택한 캐릭터의 승리 모션을 한 번 재생한 뒤 마지막 프레임을 표시한다.

## 구현

- `src/app/screens/CharacterSelect.tsx`의 `CharacterSelect`에서 상세 패널 전신 이미지를 `CharacterPreview`로 교체한다. `character: CharacterDefinition`, `selected: boolean`, `animation: 'victory'`, `loop: false`를 전달하고 React 키로 캐릭터 ID를 쓴다. 기본 선택, 다른 카드 선택, 직전 캐릭터 재선택 시 첫 프레임에서 시작한다.
- `src/app/screens/characterSelectArt.ts`에서 얼굴 URL만 반환한다. `src/app/screens/CharacterSelect.css`에서 기존 흰 아트 영역 크기를 유지하고, 96px 기준 스프라이트를 영역 크기에 맞게 중앙에 표시한다.
- `src/app/components/CharacterPreview.tsx`에서 프레임 사전 로딩과 다음 프레임 예약을 분리한다. 한 번만 재생하는 경우 마지막 프레임에서 예약을 끝낸다. 기존 재생 배율과 반복 지원을 사용한다.
- `src/app/screens/CharacterSelect.test.tsx`에서 승리 프레임 선택, 마지막 프레임 유지, 캐릭터 전환과 기존 확인 동작을 검증한다. 저장 스키마와 별도 입력 필드는 추가하지 않는다.

## 검증

- `npm.cmd test -- src/app/screens/CharacterSelect.test.tsx`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- 로컬 브라우저에서 린과 히요리를 전환해 마지막 승리 프레임이 유지되는지 확인한다.

## 검증 결과

- 전체 테스트 365개, 타입 검사, 린트, 빌드 통과.
- 로컬 Edge에서 린과 히요리의 마지막 자세 유지 확인. 1280×800, 915×412, 390×844에서 스프라이트가 패널 내부에 표시됐다.
- 사용자 피드백에 따라 선택창의 승리 모션 재생 속도를 0.8배로 조정했다. 선택창 테스트 4개와 타입 검사 통과. 로컬 Edge에서 마지막 자세 유지를 다시 확인했다.
- 상세 미리보기 배경에 캐릭터 상징색 그라데이션과 별빛, 발밑 무대를 추가했다. 로컬 Edge에서 린·히요리의 배경색 전환과 세 화면 크기의 스프라이트 표시를 검증했다. 선택창 테스트 4개와 타입 검사 통과.

## 커밋

```text
feat(ui): play selected runner victory preview once

Plan: 2026-11-18-character-select-grid-preview
Phase: P01-selector
Task: T03-selector-victory-preview
```
