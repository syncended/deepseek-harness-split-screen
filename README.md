# DeepSeek Harness — Session Split Screen

An iTerm-style session multiplexer for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI. It puts several Harness sessions on one screen and lets each pane point at a different workspace.

## Features

- Nested **vertical** (side-by-side) and **horizontal** (stacked) splits.
- Drag any divider to resize adjacent panes.
- Drag one pane header onto another to swap their sessions.
- Up to 12 panes in one layout.
- Session picker includes every visible, non-archived session from the Host.
- **New in workspace…** creates or reuses a blank session in any registered workspace.
- Live streaming transcript, session status, queued replies, stop action, and older-history loading in every pane.
- Structured-input indicator for approvals, plan review, and questions, with a jump to the full Harness view.
- Layout, split ratios, pane order, selected session ids, and unsent pane drafts persist in browser `localStorage`.
- Native **Split** conversation tab, Russian and English UI, dark-theme token compatibility, and keyboard controls.

## Install

From npm after publication:

```bash
dsh plugin --profile web add @syncended/dsh-split-screen
```

From this checkout during development:

```bash
dsh plugin --profile web add /home/syncended/deepseek-harness-split-screen
```

Some pnpm-backed profiles require the workspace-root flag:

```bash
dsh plugin --profile web add -w /home/syncended/deepseek-harness-split-screen
```

Restart `dsh web` after first installation and refresh the existing Web GUI. A native **Split** tab appears beside the conversation's other views.

## Usage

1. Open any non-blank session and select the native **Split** conversation tab.
2. Select a pane by clicking it.
3. Use **Split vertically** or **Split horizontally** in the active pane header.
4. Choose an existing session, or select **New in workspace…** to attach a fresh session from another workspace.
5. Resize with the divider. Drag one pane header onto another to swap their contents.
6. Select the native **Chat** tab to return to the full Harness conversation view.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+V` | Split the active pane vertically |
| `Alt+Shift+H` | Split the active pane horizontally |
| `Enter` | Send from the focused composer |
| `Shift+Enter` | Insert a newline |

## Workspace behavior

A single `dsh web` Host exposes all workspaces registered in that profile. The plugin can mix their sessions freely in one layout; panes do not have to share a cwd or repository.

This version does **not** aggregate sessions from separate DSH server processes or different remote URLs. Those are separate Hosts and would require a multi-connection runtime rather than a client layout plugin.

## Development

```bash
npm run check
npm test
npm pack --dry-run
```

The package has two runtime faces:

- `lib/index.js` — no-op Host loader entry.
- `lib/client.js` — dependency-free DSH lazy client module.

The browser half uses supported public seams:

- `ctx.slots.inject("conversation.view", ...)` for an additive native conversation tab.
- `ctx.sessions.list`, `open(id)`, and `binding(id).session` for session discovery, history, streaming, prompts, cancellation, and paging.
- `ctx.workspaces.list` and `connectWorkspace(id)` for cross-workspace session creation.

The layout is a persisted binary tree. Split nodes own direction and ratio; leaf nodes own stable pane ids and optional session ids. Removing a leaf collapses its parent, while header drag-and-drop swaps leaf session assignments without rebuilding the tree.

## Current limitations

- The compact panes intentionally render conversational text and compact tool/command rows, not the full Harness card registry.
- Structured approvals, plan review, and `ask_user_question` must be completed in the normal main view; the pane provides a direct jump there.
- Attachments can be represented in history, but this first version sends text prompts only.
- Browser persistence is local to the current origin/profile.

## Requirements

- DeepSeek Harness `0.1.0-rc.6` or compatible.
- The Web profile (`dsh web`).
- Node.js 18 or newer.

## License

MIT — see [`LICENSE`](./LICENSE).
