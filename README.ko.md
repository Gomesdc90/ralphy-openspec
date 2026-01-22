# ralphy-spec

[English](README.md) | [简体中文](README.zh.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

다음 도구를 위한 **Ralph 루프 + OpenSpec** 워크플로우를 한 번의 명령으로 설정:
- Cursor
- OpenCode
- Claude Code

**웹사이트:** [https://ralphy-spec.org](https://ralphy-spec.org)

## Ralphy-Spec이란?

Ralphy-Spec은 두 가지 강력한 AI 개발 방법론을 결합합니다:

### Ralph Wiggum 루프

Ralph 방법론([Geoffrey Huntley](https://ghuntley.com/ralph)가 제안)은 AI 에이전트가 작업을 완료할 때까지 **동일한 프롬프트를 반복적으로** 받는 개발 방식입니다. 각 반복에서 AI는 파일과 git 히스토리에서 이전 작업을 보고 자기 수정 피드백 루프를 형성합니다.

```
while true; do
  ai_agent "기능 X를 구축하세요. 완료되면 <promise>DONE</promise>을 출력하세요."
  # AI가 이전 작업을 보고, 실수를 수정하고, 진행을 계속합니다
done
```

### OpenSpec (스펙 기반 개발)

[OpenSpec](https://github.com/Fission-AI/OpenSpec)은 코드 전에 스펙을 요구하여 AI 코딩에 구조를 부여합니다:
- `openspec/specs/` - 진실의 원천 스펙
- `openspec/changes/` - 인수 기준이 있는 변경 제안
- 완료된 변경을 다시 병합하는 아카이브 워크플로우

### 왜 결합하는가?

| 문제 | 해결책 |
|------|--------|
| 채팅 기록의 모호한 요구사항 | OpenSpec이 의도를 구조화된 스펙에 고정 |
| AI가 중간에 멈추거나 실수함 | Ralph 루프가 완료될 때까지 재시도 |
| 정확성을 검증할 방법 없음 | 인수 기준 + 테스트로 출력 검증 |
| 도구별 설정이 번거로움 | 한 번의 명령으로 Cursor, OpenCode, Claude Code 설정 |

## 프로젝트에 설치되는 내용

- `openspec/` 스캐폴드:
  - `openspec/specs/` (진실의 원천)
  - `openspec/changes/` (활성 변경)
  - `openspec/archive/` (완료된 변경)
  - `openspec/project.md` (프로젝트 컨텍스트)
- 도구 통합:
  - Cursor: `.cursor/prompts/ralphy-*.md`
  - Claude Code: `.claude/commands/ralphy-*.md`
  - OpenCode: `AGENTS.md`
- Ralph 루프 상태/설정:
  - `.ralphy/config.json`
  - `.ralphy/ralph-loop.state.json`

## 설치

### npm (전역)

```bash
npm install -g ralphy-spec
```

### npx (설치 없이)

```bash
npx ralphy-spec init
```

### curl 설치 스크립트

```bash
curl -fsSL https://raw.githubusercontent.com/anthropics/ralphy-openspec/main/scripts/install.sh | sh
```

## 사용법

### 프로젝트에서 초기화

```bash
cd your-project
ralphy-spec init
```

비대화형 도구 선택:

```bash
ralphy-spec init --tools cursor,claude-code,opencode
```

기존 파일 덮어쓰기:

```bash
ralphy-spec init --force
```

### 설정 검증

```bash
ralphy-spec validate
```

### 템플릿 업데이트

```bash
ralphy-spec update --force
```

## 워크플로우 (PRD -> 출시)

```
PRD/요구사항 --> OpenSpec (스펙 + 작업 + 인수 기준)
                      |
                      v
                Ralph 루프 (테스트 통과까지 반복)
                      |
                      v
                아카이브 (소스 스펙에 병합)
```

### 1) 계획: PRD -> OpenSpec 변경

AI 도구에서 `/ralphy:plan` (Cursor / Claude Code)을 사용하거나 OpenCode에 `AGENTS.md`를 따르도록 요청합니다.

저장소에 예상되는 출력:

```
openspec/changes/<change-name>/
  proposal.md
  tasks.md
  specs/
    <domain>/
      spec.md
```

### 2) 구현: 완료될 때까지 반복

`/ralphy:implement`를 사용하여 작업을 구현하고 테스트를 추가합니다.

Ralph 루프 러너를 통해 실행하는 경우, 에이전트는 **모든 작업이 완료되고 테스트가 통과했을 때만** 다음을 출력해야 합니다:

```
<promise>TASK_COMPLETE</promise>
```

### 3) 검증: 테스트로 인수 기준 증명

`/ralphy:validate`를 사용하여 테스트를 실행하고 통과한 테스트를 OpenSpec 시나리오에 매핑합니다.

### 4) 아카이브: 변경을 스펙에 병합

`/ralphy:archive`를 사용하고, 가능하다면 OpenSpec CLI를 사용합니다:

```bash
openspec archive <change-name> --yes
```

## 감사의 말

Ralphy-Spec은 거인의 어깨 위에 서 있습니다:

- **Ralph Wiggum 방법론** - [Geoffrey Huntley](https://ghuntley.com/ralph)가 고안. AI 에이전트가 반복을 통해 자기 수정할 수 있다는 통찰력은 AI 지원 개발에 대한 우리의 생각을 바꾸었습니다.

- **[opencode-ralph-wiggum](https://github.com/Th0rgal/opencode-ralph-wiggum)** by [@Th0rgal](https://github.com/Th0rgal) - 우리의 통합 방식에 영감을 준 OpenCode용 깔끔한 Ralph 루프 CLI 구현.

- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** by [Fission-AI](https://github.com/Fission-AI) - AI 코딩에 구조와 예측 가능성을 부여하는 스펙 기반 개발 프레임워크.

이러한 접근 방식을 개척한 이 프로젝트들과 유지 관리자들에게 감사드립니다.

## 개발

```bash
npm install
npm run build
node bin/ralphy-spec.js --help
```

## 라이선스

BSD-3-Clause
