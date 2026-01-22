# ralphy-spec

[English](README.md) | [简体中文](README.zh.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

以下のツール向けに **Ralph ループ + OpenSpec** ワークフローを1つのコマンドでセットアップ：
- Cursor
- OpenCode
- Claude Code

**ウェブサイト:** [https://ralphy-spec.org](https://ralphy-spec.org)

## Ralphy-Specとは？

Ralphy-Specは2つの強力なAI開発方法論を組み合わせています：

### Ralph Wiggumループ

Ralph方法論（[Geoffrey Huntley](https://ghuntley.com/ralph)が提唱）は、AIエージェントがタスクを完了するまで**同じプロンプトを繰り返し**受け取る開発アプローチです。各イテレーションで、AIはファイルとgit履歴で以前の作業を確認し、自己修正フィードバックループを形成します。

```
while true; do
  ai_agent "機能Xを構築してください。完了したら<promise>DONE</promise>を出力してください。"
  # AIは以前の作業を見て、ミスを修正し、進捗を続けます
done
```

### OpenSpec（スペック駆動開発）

[OpenSpec](https://github.com/Fission-AI/OpenSpec)は、コードの前にスペックを要求することでAIコーディングに構造をもたらします：
- `openspec/specs/` - 真実の情報源となるスペック
- `openspec/changes/` - 受け入れ基準を含む変更提案
- 完了した変更をマージするアーカイブワークフロー

### なぜ組み合わせるのか？

| 問題 | 解決策 |
|------|--------|
| チャット履歴の曖昧な要件 | OpenSpecが意図を構造化されたスペックに固定 |
| AIが途中で停止したりミスをする | Ralphループが完了するまでリトライ |
| 正確性を検証する方法がない | 受け入れ基準 + テストで出力を検証 |
| ツール固有のセットアップが面倒 | 1つのコマンドでCursor、OpenCode、Claude Codeをセットアップ |

## プロジェクトにインストールされるもの

- `openspec/` スキャフォールド：
  - `openspec/specs/`（真実の情報源）
  - `openspec/changes/`（アクティブな変更）
  - `openspec/archive/`（完了した変更）
  - `openspec/project.md`（プロジェクトコンテキスト）
- ツール統合：
  - Cursor: `.cursor/prompts/ralphy-*.md`
  - Claude Code: `.claude/commands/ralphy-*.md`
  - OpenCode: `AGENTS.md`
- Ralphループ状態/設定：
  - `.ralphy/config.json`
  - `.ralphy/ralph-loop.state.json`

## インストール

### npm（グローバル）

```bash
npm install -g ralphy-spec
```

### npx（インストール不要）

```bash
npx ralphy-spec init
```

### curlインストールスクリプト

```bash
curl -fsSL https://raw.githubusercontent.com/anthropics/ralphy-openspec/main/scripts/install.sh | sh
```

## 使用方法

### プロジェクトで初期化

```bash
cd your-project
ralphy-spec init
```

非対話的なツール選択：

```bash
ralphy-spec init --tools cursor,claude-code,opencode
```

既存ファイルの上書き：

```bash
ralphy-spec init --force
```

### セットアップの検証

```bash
ralphy-spec validate
```

### テンプレートの更新

```bash
ralphy-spec update --force
```

## ワークフロー（PRD -> リリース）

```
PRD/要件 --> OpenSpec（スペック + タスク + 受け入れ基準）
                    |
                    v
              Ralphループ（テストが通るまで反復）
                    |
                    v
              アーカイブ（ソーススペックにマージ）
```

### 1) 計画：PRD -> OpenSpec変更

AIツールで`/ralphy:plan`（Cursor / Claude Code）を使用するか、OpenCodeに`AGENTS.md`に従うよう依頼します。

リポジトリでの期待される出力：

```
openspec/changes/<change-name>/
  proposal.md
  tasks.md
  specs/
    <domain>/
      spec.md
```

### 2) 実装：完了するまで反復

`/ralphy:implement`を使用してタスクを実装し、テストを追加します。

Ralphループランナーで実行する場合、エージェントは**すべてのタスクが完了しテストが通った場合のみ**以下を出力します：

```
<promise>TASK_COMPLETE</promise>
```

### 3) 検証：テストで受け入れ基準を証明

`/ralphy:validate`を使用してテストを実行し、通過したテストをOpenSpecシナリオにマッピングします。

### 4) アーカイブ：変更をスペックにマージ

`/ralphy:archive`を使用し、利用可能であればOpenSpec CLIを使用します：

```bash
openspec archive <change-name> --yes
```

## 謝辞

Ralphy-Specは巨人の肩の上に立っています：

- **Ralph Wiggum方法論** - [Geoffrey Huntley](https://ghuntley.com/ralph)が考案。AIエージェントが反復を通じて自己修正できるという洞察は、AI支援開発についての私たちの考え方を変えました。

- **[opencode-ralph-wiggum](https://github.com/Th0rgal/opencode-ralph-wiggum)** by [@Th0rgal](https://github.com/Th0rgal) - 私たちの統合アプローチにインスピレーションを与えたOpenCode用のクリーンなRalphループCLI実装。

- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** by [Fission-AI](https://github.com/Fission-AI) - AIコーディングに構造と予測可能性をもたらすスペック駆動開発フレームワーク。

これらのアプローチを開拓したこれらのプロジェクトとメンテナーに感謝します。

## 開発

```bash
npm install
npm run build
node bin/ralphy-spec.js --help
```

## ライセンス

BSD-3-Clause
