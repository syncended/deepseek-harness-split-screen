window.__ModuleLoader__.load({
  id: "@syncended/dsh-split-screen",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const { IconApiOutline14, IconChevronDownOutline14, IconThinkOutline14, MarkdownText, MessageText } = require("@deepseek-ai/dsh-client-ui-primitives");
    const h = React.createElement;

    const PLUGIN_ID = "@syncended/dsh-split-screen";
    const STYLE_ID = `${PLUGIN_ID}/client.css`;
    const STORAGE_KEY = "dsh.split-screen.layout.v1";
    const DRAFTS_KEY = "dsh.split-screen.drafts.v1";
    const LAYOUT_EVENT = "dsh-split-screen:layout";
    const MAX_PANES = 12;
    const EMPTY_LIST = Object.freeze({
      ids: Object.freeze([]),
      byId: Object.freeze({}),
      current: undefined,
      phase: "pending",
      subagentsByParent: Object.freeze({}),
      jobsBySession: Object.freeze({}),
      currentAddress: undefined,
    });
    const EMPTY_WORKSPACES = Object.freeze({
      items: Object.freeze([]),
      archivedSessionIds: Object.freeze([]),
      state: "idle",
      phase: "pending",
      baselinesReady: false,
      recentWorkspaceId: undefined,
      error: null,
    });
    const EMPTY_SESSION = Object.freeze({
      sessionId: "",
      nodes: Object.freeze([]),
      partial: null,
      pending: Object.freeze([]),
      queue: Object.freeze([]),
      running: false,
      composerPhase: "blank",
      removed: false,
      openState: "cold",
      openError: null,
      hasMore: false,
      loadingOlder: false,
      promptError: null,
      blank: true,
      lastAgentError: null,
    });

    const CSS = String.raw`
.dsh-split-workspace-view {
  --dsh-split-accent: var(--dsw-alias-state-business-primary, #5870ee);
  --dsh-split-accent-soft: var(--dsw-alias-interactive-bg-hover, rgba(88,112,238,.13));
  --dsh-split-bg: var(--dsw-alias-bg-base, #f5f6f8);
  --dsh-split-panel: var(--dsw-alias-bg-layer-1, #fff);
  --dsh-split-panel-2: var(--dsw-alias-bg-layer-2, #f7f8fa);
  --dsh-split-border: var(--dsw-alias-border-l2, rgba(20,24,32,.14));
  --dsh-split-text: var(--dsw-alias-label-primary, #181b20);
  --dsh-split-muted: var(--dsw-alias-label-tertiary, #737985);
  --dsh-split-danger: var(--dsw-alias-state-error-primary, #d14343);
  --dsh-split-warn: var(--dsw-alias-state-warn-primary, #d99624);
  --dsh-split-success: var(--dsw-alias-state-success-primary, #2ca568);
}
[data-conversation-scroll]:has(.dsh-split-workspace-view) { min-height:0; overflow:hidden; }
[data-conversation-scroll]:has(.dsh-split-workspace-view) > [data-composer-seat] { display:none; }
[data-conversation-scroll]:has(.dsh-split-workspace-view) [data-slot="conversation.session"],
[data-conversation-scroll]:has(.dsh-split-workspace-view) [data-slot="conversation.view"] { min-height:0; }
[data-conversation-scroll]:has(.dsh-split-workspace-view) > [data-slot="conversation.session"] > :has(.dsh-split-workspace-view) {
  height:100%; min-height:0!important; flex:1 1 0!important; overflow:hidden;
}
.dsh-split-workspace-view {
  width:100%; height:100%; min-width:0; min-height:0; display:flex; overflow:hidden;
  color:var(--dsh-split-text); background:var(--dsh-split-bg);
  font:13px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
.dsh-split-visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.dsh-split-canvas { width:100%; min-width:0; min-height:0; flex:1; overflow:hidden; background:var(--dsh-split-bg); }
.dsh-split-node { width:100%; height:100%; min-width:0; min-height:0; display:flex; overflow:hidden; }
.dsh-split-node[data-direction="row"] { flex-direction:row; }
.dsh-split-node[data-direction="column"] { flex-direction:column; }
.dsh-split-child { min-width:0; min-height:0; overflow:hidden; }
.dsh-split-divider { position:relative; z-index:2; flex:none; touch-action:none; background:var(--dsh-split-border); }
.dsh-split-node[data-direction="row"] > .dsh-split-divider { width:1px; margin:0 4px; cursor:col-resize; }
.dsh-split-node[data-direction="column"] > .dsh-split-divider { height:1px; margin:4px 0; cursor:row-resize; }
.dsh-split-divider:after { content:""; position:absolute; inset:-4px; background:transparent; transition:background 120ms ease; }
.dsh-split-divider:hover:after,.dsh-split-divider[data-dragging]:after { background:color-mix(in srgb,var(--dsh-split-accent) 28%,transparent); }
.dsh-split-pane { width:100%; height:100%; min-width:220px; min-height:160px; display:flex; flex-direction:column; overflow:hidden; background:var(--dsh-split-panel); }
.dsh-split-pane-body { min-width:0; min-height:0; flex:1; display:grid; grid-template-rows:auto minmax(0,1fr) auto; overflow:hidden; }
.dsh-split-pane-body[data-picker="true"] { display:block; }
.dsh-split-pane[data-drop="true"] { box-shadow:inset 0 0 0 2px var(--dsh-split-accent); }
.dsh-split-pane-header { min-width:0; height:38px; box-sizing:border-box; display:flex; align-items:center; gap:7px; padding:4px 6px 4px 10px; border-bottom:1px solid var(--dsh-split-border); background:var(--dsh-split-panel); cursor:grab; }
.dsh-split-pane[data-active="true"] > .dsh-split-pane-header { box-shadow:inset 0 -2px 0 var(--dsh-split-accent); }
.dsh-split-pane-header:active { cursor:grabbing; }
.dsh-split-status-dot { width:7px; height:7px; flex:none; border-radius:50%; background:var(--dsh-split-muted); }
.dsh-split-status-dot[data-state="running"] { background:var(--dsh-split-accent); animation:dsh-split-pulse 1.3s infinite; }
.dsh-split-status-dot[data-state="waiting"] { background:var(--dsh-split-warn); }
.dsh-split-status-dot[data-state="done"] { background:var(--dsh-split-success); }
@keyframes dsh-split-pulse { 50% { opacity:.35; transform:scale(.75); } }
.dsh-split-title { min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:550; }
.dsh-split-workspace { min-width:0; max-width:25%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dsh-split-muted); font-size:11px; }
.dsh-split-header-actions { display:flex; align-items:center; opacity:.18; transition:opacity 120ms ease; }
.dsh-split-pane:hover .dsh-split-header-actions,.dsh-split-pane[data-active="true"] .dsh-split-header-actions,.dsh-split-header-actions:focus-within { opacity:1; }
.dsh-split-header-action { width:27px; height:27px; flex:none; display:grid; place-items:center; padding:0; border:0; border-radius:7px; color:var(--dsh-split-muted); background:transparent; cursor:pointer; }
.dsh-split-header-action:hover { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
.dsh-split-header-action:disabled { opacity:.35; cursor:not-allowed; }
.dsh-split-session-bar { min-width:0; display:flex; align-items:center; gap:7px; padding:5px 8px; border-bottom:1px solid var(--dsh-split-border); background:var(--dsh-split-panel); }
.dsh-split-session-bar .dsh-split-select { height:28px; border-color:transparent; background:transparent; }
.dsh-split-session-bar .dsh-split-select:hover,.dsh-split-session-bar .dsh-split-select:focus { border-color:var(--dsh-split-border); background:var(--dsh-split-panel-2); }
.dsh-split-new-select { max-width:148px; color:var(--dsh-split-muted); }
.dsh-split-button,.dsh-split-icon,.dsh-split-select,.dsh-split-compose textarea { box-sizing:border-box; color:var(--dsh-split-text); border:1px solid var(--dsh-split-border); background:var(--dsh-split-panel-2); font:inherit; }
.dsh-split-button { min-height:30px; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:4px 10px; border-radius:9px; cursor:pointer; }
.dsh-split-button:hover,.dsh-split-icon:hover { background:var(--dsh-split-accent-soft); }
.dsh-split-button:disabled,.dsh-split-icon:disabled { opacity:.45; cursor:not-allowed; }
.dsh-split-icon { width:32px; height:32px; padding:0; display:grid; place-items:center; border-radius:9px; cursor:pointer; }
.dsh-split-select { min-width:0; height:32px; width:100%; padding:0 9px; border-radius:9px; }
.dsh-split-transcript { min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain; padding:16px; scrollbar-width:thin; }
.dsh-split-flow { width:100%; max-width:var(--dsh-chat-content-width,748px); min-height:100%; margin:0 auto; display:flex; flex-direction:column; gap:16px; }
.dsh-split-empty { min-height:110px; flex:1; display:grid; place-items:center; padding:24px; color:var(--dsh-split-muted); text-align:center; }
.dsh-split-message { min-width:0; max-width:100%; padding:0; border:0; overflow-wrap:anywhere; color:var(--dsh-split-text); background:transparent; }
.dsh-split-message[data-role="assistant"] { font-size:16px; line-height:28px; }
.dsh-split-assistant-blocks { min-width:0; display:flex; flex-direction:column; gap:16px; }
.dsh-split-reasoning { min-width:0; color:var(--dsw-alias-label-tertiary,var(--dsh-split-muted)); font-size:14px; line-height:24px; }
.dsh-split-reasoning summary { width:fit-content; max-width:100%; display:flex; align-items:center; border-radius:6px; padding:0 4px; cursor:pointer; list-style:none; color:var(--dsw-alias-label-secondary,var(--dsh-split-muted)); font-weight:500; }
.dsh-split-reasoning summary::-webkit-details-marker { display:none; }
.dsh-split-reasoning summary:hover { background:var(--dsh-split-accent-soft); }
.dsh-split-reasoning-icon { width:18px; flex:none; margin-right:4px; text-align:center; }
.dsh-split-reasoning-chevron { flex:none; margin-left:6px; color:var(--dsw-alias-label-caption,var(--dsh-split-muted)); transition:transform 120ms ease; }
.dsh-split-reasoning[open] .dsh-split-reasoning-chevron { transform:rotate(180deg); }
.dsh-split-reasoning-body { max-height:320px; margin:6px 0 0 22px; padding-left:10px; overflow:auto; border-left:1px solid var(--dsh-split-border); color:var(--dsw-alias-label-tertiary,var(--dsh-split-muted)); font-size:14px; line-height:24px; }
.dsh-split-image-label { color:var(--dsh-split-muted); font-size:13px; }
.dsh-split-message[data-role="user"] { width:fit-content; max-width:min(525px,82%); margin-left:auto; padding:10px 16px; border-radius:22px; background:var(--dsw-specific-bubble,var(--dsh-split-accent-soft)); font-size:16px; line-height:24px; white-space:pre-wrap; }
.dsh-split-message[data-role="system"] { padding:2px 0; color:var(--dsh-split-muted); font-size:14px; line-height:24px; white-space:pre-wrap; }
.dsh-split-message[data-role="error"] { padding:8px 10px; border-radius:8px; color:var(--dsh-split-danger); background:var(--dsw-alias-interactive-bg-hover-danger,rgba(209,67,67,.07)); font-size:13px; line-height:20px; white-space:pre-wrap; }
.dsh-split-stream { opacity:.9; }
.dsh-split-tool { min-width:0; border-radius:6px; color:var(--dsw-alias-label-secondary,var(--dsh-split-muted)); }
.dsh-split-tool summary { min-width:0; height:28px; display:flex; align-items:center; border-radius:6px; padding:0 4px; cursor:pointer; list-style:none; font-size:14px; line-height:24px; }
.dsh-split-tool summary::-webkit-details-marker { display:none; }
.dsh-split-tool summary:hover { background:var(--dsh-split-accent-soft); }
.dsh-split-tool-icon { width:18px; height:18px; flex:none; display:grid; place-items:center; margin-right:4px; color:var(--dsw-alias-label-secondary,var(--dsh-split-muted)); font-size:16px; }
.dsh-split-tool[data-error="true"] .dsh-split-tool-icon,.dsh-split-tool[data-error="true"] .dsh-split-tool-title { color:var(--dsh-split-danger); }
.dsh-split-tool-title { min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-split-tool-chevron { flex:none; margin-left:8px; color:var(--dsw-alias-label-caption,var(--dsh-split-muted)); transition:transform 120ms ease; }
.dsh-split-tool[open] .dsh-split-tool-chevron { transform:rotate(180deg); }
.dsh-split-tool pre { max-height:240px; margin:4px 0 0 22px; padding:8px 10px; overflow:auto; border-radius:8px; color:var(--dsw-alias-label-tertiary,var(--dsh-split-muted)); background:var(--dsh-split-panel-2); white-space:pre-wrap; overflow-wrap:anywhere; font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-split-history { display:flex; justify-content:center; }
.dsh-split-banner { min-height:32px; display:flex; align-items:center; gap:7px; padding:5px 10px; color:#8a5b08; background:rgba(217,150,36,.11); border-bottom:1px solid rgba(217,150,36,.23); font-size:11px; }
.dsh-split-banner button { margin-left:auto; border:0; color:inherit; background:transparent; text-decoration:underline; cursor:pointer; }
.dsh-split-compose { padding:8px 10px 6px; border-top:1px solid var(--dsh-split-border); background:var(--dsh-split-panel); }
.dsh-split-compose-row { display:flex; align-items:flex-end; gap:7px; }
.dsh-split-compose textarea { min-width:0; flex:1; min-height:38px; max-height:120px; resize:none; border-radius:13px; padding:9px 11px; background:var(--dsh-split-panel-2); }
.dsh-split-send { width:38px; height:38px; flex:none; display:grid; place-items:center; border:0; border-radius:12px; color:#fff; background:var(--dsh-split-accent); cursor:pointer; }
.dsh-split-send:disabled { opacity:.4; cursor:not-allowed; }
.dsh-split-stop { color:var(--dsh-split-danger); background:rgba(209,67,67,.08); }
.dsh-split-compose-meta { min-height:14px; padding:3px 3px 0; color:var(--dsh-split-muted); font-size:10px; }
.dsh-split-compose-meta[data-error="true"] { color:var(--dsh-split-danger); }
.dsh-split-picker { height:100%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:12px; padding:28px; }
.dsh-split-picker h3,.dsh-split-picker p { max-width:420px; margin:0; text-align:center; }
.dsh-split-picker h3 { font-size:15px; font-weight:550; }
.dsh-split-picker p { color:var(--dsh-split-muted); }
.dsh-split-picker .dsh-split-select { flex:none; max-width:420px; }
.dsh-split-button:focus-visible,.dsh-split-icon:focus-visible,.dsh-split-header-action:focus-visible,.dsh-split-select:focus-visible,.dsh-split-compose textarea:focus-visible { outline:2px solid var(--dsh-split-accent); outline-offset:2px; }
@media (max-width:760px) { .dsh-split-workspace { display:none; } .dsh-split-pane{min-width:180px}.dsh-split-transcript{padding:14px 12px 20px}.dsh-split-picker{padding:18px} }
@media (prefers-reduced-motion:reduce) { .dsh-split-status-dot,.dsh-split-header-actions { animation:none!important; transition:none!important; } }
`;

    function installStyle(doc) {
      if (!doc || doc.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_ID)}]`)) return;
      const tag = doc.createElement("style");
      tag.dataset.plugin = PLUGIN_ID;
      tag.dataset.pluginCss = STYLE_ID;
      tag.textContent = CSS;
      doc.head.appendChild(tag);
    }
    if (typeof document !== "undefined") installStyle(document);

    function uid(prefix = "pane") {
      const random = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
      return `${prefix}-${random}`;
    }

    function pane(sessionId = null, id = uid("pane")) {
      return { type: "pane", id, sessionId: typeof sessionId === "string" && sessionId ? sessionId : null };
    }

    function countPanes(node) {
      if (!node || typeof node !== "object") return 0;
      return node.type === "pane" ? 1 : countPanes(node.first) + countPanes(node.second);
    }

    function paneIds(node, output = []) {
      if (!node) return output;
      if (node.type === "pane") output.push(node.id);
      else {
        paneIds(node.first, output);
        paneIds(node.second, output);
      }
      return output;
    }

    function sessionIds(node, output = []) {
      if (!node) return output;
      if (node.type === "pane") {
        if (node.sessionId && !output.includes(node.sessionId)) output.push(node.sessionId);
      } else {
        sessionIds(node.first, output);
        sessionIds(node.second, output);
      }
      return output;
    }

    function mapPanes(node, mapper) {
      if (node.type === "pane") return mapper(node);
      const first = mapPanes(node.first, mapper);
      const second = mapPanes(node.second, mapper);
      return first === node.first && second === node.second ? node : { ...node, first, second };
    }

    function splitPane(node, targetId, direction, newPane = pane()) {
      if (node.type === "pane") {
        if (node.id !== targetId) return node;
        return { type: "split", id: uid("split"), direction: direction === "column" ? "column" : "row", ratio: 0.5, first: node, second: newPane };
      }
      const first = splitPane(node.first, targetId, direction, newPane);
      if (first !== node.first) return { ...node, first };
      const second = splitPane(node.second, targetId, direction, newPane);
      return second === node.second ? node : { ...node, second };
    }

    function removePane(node, targetId) {
      if (node.type === "pane") return node.id === targetId ? null : node;
      const first = removePane(node.first, targetId);
      const second = removePane(node.second, targetId);
      if (!first) return second;
      if (!second) return first;
      return first === node.first && second === node.second ? node : { ...node, first, second };
    }

    function setSplitRatio(node, splitId, ratio) {
      if (node.type === "pane") return node;
      if (node.id === splitId) return { ...node, ratio: Math.max(0.15, Math.min(0.85, ratio)) };
      const first = setSplitRatio(node.first, splitId, ratio);
      const second = setSplitRatio(node.second, splitId, ratio);
      return first === node.first && second === node.second ? node : { ...node, first, second };
    }

    function swapPaneSessions(node, firstId, secondId) {
      if (!firstId || !secondId || firstId === secondId) return node;
      let a;
      let b;
      mapPanes(node, (item) => {
        if (item.id === firstId) a = item.sessionId;
        if (item.id === secondId) b = item.sessionId;
        return item;
      });
      if (a === undefined || b === undefined) return node;
      return mapPanes(node, (item) => item.id === firstId ? { ...item, sessionId: b } : item.id === secondId ? { ...item, sessionId: a } : item);
    }

    function sanitizeLayout(raw) {
      const seen = new Set();
      let panes = 0;
      function visit(node, depth) {
        if (!node || typeof node !== "object" || depth > 20) return null;
        if (node.type === "pane") {
          if (panes >= MAX_PANES || typeof node.id !== "string" || !node.id || seen.has(node.id)) return null;
          panes += 1;
          seen.add(node.id);
          return pane(typeof node.sessionId === "string" ? node.sessionId : null, node.id);
        }
        if (node.type !== "split" || typeof node.id !== "string" || !node.id || seen.has(node.id)) return null;
        seen.add(node.id);
        const first = visit(node.first, depth + 1);
        const second = visit(node.second, depth + 1);
        if (!first) return second;
        if (!second) return first;
        const ratio = typeof node.ratio === "number" && Number.isFinite(node.ratio) ? Math.max(0.15, Math.min(0.85, node.ratio)) : 0.5;
        return { type: "split", id: node.id, direction: node.direction === "column" ? "column" : "row", ratio, first, second };
      }
      return visit(raw, 0);
    }

    function loadLayout(fallbackSessionId) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = sanitizeLayout(JSON.parse(stored));
          if (parsed) return parsed;
        }
      } catch (error) {
        console.warn("dsh split-screen: could not restore layout", error);
      }
      return pane(fallbackSessionId || null);
    }

    function saveLayout(layout) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch (error) {
        console.warn("dsh split-screen: could not persist layout", error);
      }
    }

    function publishLayout(layout) {
      saveLayout(layout);
      window.dispatchEvent(new CustomEvent(LAYOUT_EVENT, { detail: layout }));
    }

    function readDrafts() {
      try {
        const value = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}");
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
      } catch {
        return {};
      }
    }

    function loadDraft(key) {
      const value = readDrafts()[key];
      return typeof value === "string" ? value : "";
    }

    function saveDraft(key, value) {
      try {
        const drafts = readDrafts();
        if (value) drafts[key] = value;
        else delete drafts[key];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      } catch (error) {
        console.warn("dsh split-screen: could not persist draft", error);
      }
    }

    function isRussian() {
      return typeof navigator !== "undefined" && /^ru(?:-|$)/i.test(navigator.language || "");
    }

    const COPY = {
      en: {
        tab: "Split", title: "Session Splitter",
        vertical: "Split vertically", horizontal: "Split horizontally", reset: "Reset layout",
        choose: "Choose a session", chooseHint: "Attach any Harness session, including sessions from another workspace.",
        noSession: "Empty pane", newWorkspace: "New in workspace…", session: "Session…", remove: "Close pane",
        drag: "Drag this header onto another pane to swap them", loading: "Loading conversation…", empty: "No messages yet.",
        user: "You", agent: "Agent", system: "Status", tool: "Tool", image: "[Image]", reasoning: "Reasoning",
        placeholder: "Message this session…", send: "Send", stop: "Stop", sending: "Sending…",
        queue: "Enter to send · Shift+Enter for a new line", queued: "The message will be queued after the current turn",
        working: "Agent is working", waiting: "This session needs structured input in the main view", openMain: "Open main view",
        unavailable: "This session is unavailable. Pick another one.", loadOlder: "Load older messages", creating: "Creating session…",
        retry: "The model request is being retried.", maxTokens: "The response reached its output limit.", interrupted: "Response stopped",
        unknownError: "The operation failed.", paneLimit: "Maximum 12 panes", swapHint: "Drop to swap sessions",
      },
      ru: {
        tab: "Сплит", title: "Разделение сессий",
        vertical: "Разделить вертикально", horizontal: "Разделить горизонтально", reset: "Сбросить раскладку",
        choose: "Выберите сессию", chooseHint: "Можно подключить любую сессию Harness, в том числе из другого workspace.",
        noSession: "Пустая панель", newWorkspace: "Новая в workspace…", session: "Сессия…", remove: "Закрыть панель",
        drag: "Перетащите заголовок на другую панель, чтобы поменять их местами", loading: "Загружаем переписку…", empty: "Сообщений пока нет.",
        user: "Вы", agent: "Агент", system: "Статус", tool: "Инструмент", image: "[Изображение]", reasoning: "Рассуждение",
        placeholder: "Написать в эту сессию…", send: "Отправить", stop: "Остановить", sending: "Отправляем…",
        queue: "Enter — отправить · Shift+Enter — новая строка", queued: "Сообщение встанет в очередь после текущего хода",
        working: "Агент работает", waiting: "Сессии нужен структурированный ответ в основном интерфейсе", openMain: "Открыть основной вид",
        unavailable: "Сессия недоступна. Выберите другую.", loadOlder: "Загрузить старые сообщения", creating: "Создаём сессию…",
        retry: "Запрос к модели повторяется.", maxTokens: "Ответ достиг лимита вывода.", interrupted: "Ответ остановлен",
        unknownError: "Операция завершилась ошибкой.", paneLimit: "Максимум 12 панелей", swapHint: "Отпустите, чтобы поменять сессии местами",
      },
    };
    function copy() { return isRussian() ? COPY.ru : COPY.en; }

    function basename(path) {
      if (!path) return "";
      return String(path).replace(/[/\\]+$/, "").split(/[/\\]/).pop() || path;
    }

    function textOfContent(content, imageLabel) {
      if (!Array.isArray(content)) return "";
      return content.map((block) => {
        if (block && block.type === "text" && typeof block.text === "string") return block.text;
        if (block && (block.type === "image" || block.type === "image_url")) return imageLabel;
        return "";
      }).filter(Boolean).join("\n");
    }

    function textOfAssistant(blocks, activeCopy) {
      if (!Array.isArray(blocks)) return "";
      return blocks.map((block) => {
        if (block && block.kind === "text" && typeof block.text === "string") return block.text;
        if (block && block.kind === "reasoning" && typeof block.text === "string") return `${activeCopy.reasoning}:\n${block.text}`;
        if (block && block.kind === "image") return activeCopy.image;
        return "";
      }).filter(Boolean).join("\n\n");
    }

    function truncate(text, limit = 480) {
      const value = String(text || "");
      return value.length > limit ? `${value.slice(0, limit)}…` : value;
    }

    function projectNode(node, activeCopy) {
      if (!node || typeof node !== "object") return null;
      if (node.kind === "user" || node.kind === "steering") {
        const text = textOfContent(node.content, activeCopy.image);
        return text ? { role: "user", label: activeCopy.user, text, key: `${node.kind}-${node.seq}` } : null;
      }
      if (node.kind === "assistant") {
        const text = textOfAssistant(node.blocks, activeCopy);
        if (!text && !node.interrupted) return null;
        return { role: "assistant", label: activeCopy.agent, reasoningLabel: activeCopy.reasoning, imageLabel: activeCopy.image, text: text || activeCopy.interrupted, blocks: node.blocks, key: `assistant-${node.seq}` };
      }
      if (node.kind === "context") {
        const text = textOfContent(node.content, activeCopy.image);
        return text ? { role: "system", label: activeCopy.system, text: truncate(text), key: `context-${node.seq}` } : null;
      }
      if (node.kind === "tool-result") {
        const name = node.call && node.call.name ? node.call.name : node.callId || activeCopy.tool;
        const body = textOfContent(node.content, activeCopy.image);
        return { role: node.isError ? "error" : "tool", label: activeCopy.tool, text: `${node.isError ? "✕" : "✓"} ${name}${body ? `\n${truncate(body, 320)}` : ""}`, key: `tool-${node.seq}` };
      }
      if (node.kind === "command") {
        const command = `/${node.name || "command"}${node.args || ""}`;
        return { role: node.outcome && node.outcome.kind === "error" ? "error" : "tool", label: activeCopy.system, text: `${command}${node.outcome && node.outcome.text ? `\n${node.outcome.text}` : ""}`, key: `command-${node.seq}` };
      }
      if (node.kind === "turn-error") return { role: "error", label: activeCopy.system, text: node.message || activeCopy.unknownError, key: `error-${node.seq}` };
      if (node.kind === "turn-max-tokens") return { role: "system", label: activeCopy.system, text: activeCopy.maxTokens, key: `max-${node.seq}` };
      if (node.kind === "model-retry") return { role: "system", label: activeCopy.system, text: activeCopy.retry, key: `retry-${node.seq}` };
      if (node.kind === "compaction") return { role: "system", label: activeCopy.system, text: "Conversation compacted", key: `compaction-${node.seq}` };
      return null;
    }

    function errorMessage(error, fallback) {
      if (error && typeof error.message === "string" && error.message) return error.message;
      if (typeof error === "string" && error) return error;
      return fallback;
    }

    function useObservable(observable, fallback) {
      return React.useSyncExternalStore(
        observable ? observable.subscribe : () => () => {},
        observable ? observable.getSnapshot : () => fallback,
        () => fallback,
      );
    }

    function useSessionSnapshot(sessions, sessionId) {
      const binding = sessionId ? sessions.binding(sessionId) : undefined;
      const session = binding && binding.session;
      const subscribe = React.useCallback((listener) => session ? session.subscribe(listener) : () => {}, [session]);
      const getSnapshot = React.useCallback(() => session ? session.getSnapshot() : EMPTY_SESSION, [session]);
      const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
      return { session, snapshot };
    }

    function statusOf(summary, snapshot) {
      if ((summary && summary.pendingInteraction) || (snapshot.pending && snapshot.pending.length)) return "waiting";
      if ((summary && summary.running) || snapshot.running) return "running";
      if (summary && summary.completed) return "done";
      return "ready";
    }

    function sessionWorkspace(summary, workspaces) {
      if (!summary) return "";
      const owner = (workspaces.items || []).find((workspace) => (workspace.sessionIds || []).includes(summary.id));
      return owner ? owner.title : basename(summary.cwd || "");
    }

    function sessionOptions(list, workspaces, activeCopy) {
      const archived = new Set(workspaces.archivedSessionIds || []);
      return (list.ids || []).map((id) => list.byId[id]).filter((row) => row && !archived.has(row.id)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((row) => {
        const workspace = sessionWorkspace(row, workspaces);
        return h("option", { value: row.id, key: row.id }, `${workspace ? `${workspace} — ` : ""}${row.displayTitle || row.title || row.id}`);
      });
    }

    function LayoutGlyph({ direction, size = 18 }) {
      const vertical = direction === "row";
      return h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true },
        h("rect", { x: "3", y: "4", width: "18", height: "16", rx: "3", stroke: "currentColor", strokeWidth: "1.8" }),
        vertical ? h("path", { d: "M12 4v16", stroke: "currentColor", strokeWidth: "1.8" }) : h("path", { d: "M3 12h18", stroke: "currentColor", strokeWidth: "1.8" }),
      );
    }

    function ArrowGlyph() {
      return h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true }, h("path", { d: "M5 12h13m-5-5 5 5-5 5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }));
    }

    function ToolMessage({ row }) {
      const [title, ...bodyLines] = row.text.split("\n");
      const body = bodyLines.join("\n").trim();
      return h("details", { className: "dsh-split-tool", "data-error": row.role === "error" || undefined },
        h("summary", null,
          h("span", { className: "dsh-split-tool-icon", "aria-hidden": true }, row.role === "error" ? "!" : h(IconApiOutline14)),
          h("span", { className: "dsh-split-tool-title" }, title),
          body ? h("span", { className: "dsh-split-tool-chevron", "aria-hidden": true }, h(IconChevronDownOutline14)) : null,
        ),
        body ? h("pre", null, body) : null,
      );
    }

    function AssistantMessage({ row, streaming }) {
      if (!Array.isArray(row.blocks)) return h(MarkdownText, { text: row.text, streaming });
      const visible = row.blocks.filter((block) => block && (block.kind === "text" || block.kind === "reasoning" || block.kind === "image"));
      if (visible.length === 0) return h(MarkdownText, { text: row.text, streaming });
      return h("div", { className: "dsh-split-assistant-blocks" }, visible.map((block, index) => {
        if (block.kind === "reasoning") return h("details", { className: "dsh-split-reasoning", open: streaming && index === visible.length - 1, key: `reasoning-${index}` },
          h("summary", null,
            h("span", { className: "dsh-split-reasoning-icon", "aria-hidden": true }, h(IconThinkOutline14)),
            h("span", null, row.reasoningLabel || "Reasoning"),
            h("span", { className: "dsh-split-reasoning-chevron", "aria-hidden": true }, h(IconChevronDownOutline14)),
          ),
          h("div", { className: "dsh-split-reasoning-body" }, h(MarkdownText, { text: block.text || "", streaming })),
        );
        if (block.kind === "image") return h("span", { className: "dsh-split-image-label", key: `image-${index}` }, row.imageLabel || "[Image]");
        return h(MarkdownText, { text: block.text || "", streaming: streaming && index === visible.length - 1, key: `text-${index}` });
      }));
    }

    function MessageRow({ row, streaming = false }) {
      if (row.role === "tool" || (row.key && (row.key.startsWith("tool-") || row.key.startsWith("command-")))) return h(ToolMessage, { row });
      if (row.role === "user") return h("div", { className: "dsh-split-message", "data-role": row.role }, h(MessageText, { text: row.text }));
      if (row.role === "assistant") return h("div", { className: `dsh-split-message${streaming ? " dsh-split-stream" : ""}`, "data-role": row.role }, h(AssistantMessage, { row, streaming }));
      return h("div", { className: "dsh-split-message", "data-role": row.role }, row.text);
    }

    function MessageList({ session, snapshot, activeCopy }) {
      const endRef = React.useRef(null);
      const rows = (snapshot.nodes || []).map((node) => projectNode(node, activeCopy)).filter(Boolean).slice(-80);
      const partialText = snapshot.partial ? textOfAssistant(snapshot.partial.blocks, activeCopy) : "";
      React.useEffect(() => {
        if (endRef.current) endRef.current.scrollIntoView({ block: "end" });
      }, [rows.length, partialText]);

      if (snapshot.openState === "cold" || snapshot.openState === "loading") return h("div", { className: "dsh-split-transcript" }, h("div", { className: "dsh-split-empty" }, activeCopy.loading));
      if (snapshot.openState === "error") return h("div", { className: "dsh-split-transcript" }, h("div", { className: "dsh-split-empty" }, errorMessage(snapshot.openError, activeCopy.unknownError)));
      const children = [];
      if (snapshot.hasMore) children.push(h("div", { className: "dsh-split-history", key: "older" }, h("button", { type: "button", className: "dsh-split-button", disabled: snapshot.loadingOlder, onClick: () => void session.loadOlder() }, activeCopy.loadOlder)));
      for (const row of rows) children.push(h(MessageRow, { row, key: row.key }));
      if (partialText) children.push(h(MessageRow, { row: { role: "assistant", reasoningLabel: activeCopy.reasoning, imageLabel: activeCopy.image, text: partialText, blocks: snapshot.partial.blocks }, streaming: true, key: "partial" }));
      if (children.length === 0) children.push(h("div", { className: "dsh-split-empty", key: "empty" }, activeCopy.empty));
      children.push(h("div", { ref: endRef, key: "end" }));
      return h("div", { className: "dsh-split-transcript", "aria-live": "polite" }, h("div", { className: "dsh-split-flow" }, children));
    }

    function SessionPicker({ paneId, list, workspaces, assign, createInWorkspace, creating, activeCopy }) {
      return h("div", { className: "dsh-split-picker" },
        h("h3", null, activeCopy.choose),
        h("p", null, activeCopy.chooseHint),
        h("select", { className: "dsh-split-select", defaultValue: "", onChange: (event) => { const id = event.currentTarget.value; if (id) assign(paneId, id); } },
          h("option", { value: "", disabled: true }, activeCopy.session),
          sessionOptions(list, workspaces, activeCopy),
        ),
        h("select", { className: "dsh-split-select", value: "", disabled: creating, onChange: (event) => { const id = event.currentTarget.value; if (id) void createInWorkspace(paneId, id); } },
          h("option", { value: "" }, creating ? activeCopy.creating : activeCopy.newWorkspace),
          (workspaces.items || []).map((workspace) => h("option", { value: workspace.workspaceId, key: workspace.workspaceId }, workspace.title)),
        ),
      );
    }

    function PaneView(props) {
      const { node, list, workspaces, sessions, active, paneCount, onActive, onAssign, onCreateWorkspace, onSplit, onRemove, onReset, onSwap, onOpenMain, activeCopy } = props;
      const summary = node.sessionId ? list.byId[node.sessionId] : undefined;
      const available = Boolean(summary);
      const { session, snapshot } = useSessionSnapshot(sessions, available ? node.sessionId : null);
      const draftKey = `${node.id}:${node.sessionId || "empty"}`;
      const [draft, setDraft] = React.useState(() => loadDraft(draftKey));
      const [sending, setSending] = React.useState(false);
      const [creating, setCreating] = React.useState(false);
      const [error, setError] = React.useState("");
      const [drop, setDrop] = React.useState(false);
      const state = statusOf(summary, snapshot);
      const workspace = sessionWorkspace(summary, workspaces);
      const waiting = state === "waiting";
      const canSend = Boolean(session && snapshot.openState === "open" && !snapshot.removed && draft.trim() && !sending);

      React.useEffect(() => saveDraft(draftKey, draft), [draftKey, draft]);

      const send = async () => {
        const text = draft.trim();
        if (!canSend || !text) return;
        setSending(true);
        setError("");
        try {
          const result = await session.prompt([{ type: "text", text }], "queue");
          if (!result.ok) throw result.error;
          setDraft("");
        } catch (cause) {
          setError(errorMessage(cause, activeCopy.unknownError));
        } finally {
          setSending(false);
        }
      };

      const cancel = async () => {
        if (!session) return;
        setError("");
        const result = await session.cancel();
        if (!result.ok) setError(errorMessage(result.error, activeCopy.unknownError));
      };

      const createWorkspace = async (paneId, workspaceId) => {
        setCreating(true);
        setError("");
        try { await onCreateWorkspace(paneId, workspaceId); }
        catch (cause) { setError(errorMessage(cause, activeCopy.unknownError)); }
        finally { setCreating(false); }
      };

      const header = h("header", {
        className: "dsh-split-pane-header", draggable: true, title: activeCopy.drag,
        onDragStart: (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-dsh-split-pane", node.id); },
        onDragOver: (event) => { if (event.dataTransfer.types.includes("application/x-dsh-split-pane")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDrop(true); } },
        onDragLeave: () => setDrop(false),
        onDrop: (event) => { event.preventDefault(); setDrop(false); onSwap(event.dataTransfer.getData("application/x-dsh-split-pane"), node.id); },
        onDragEnd: () => setDrop(false),
      },
        h("span", { className: "dsh-split-status-dot", "data-state": state }),
        h("span", { className: "dsh-split-title" }, summary ? summary.displayTitle || summary.title || summary.id : activeCopy.noSession),
        workspace ? h("span", { className: "dsh-split-workspace", title: summary && summary.cwd }, workspace) : null,
        h("span", { className: "dsh-split-header-actions" },
          active ? h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.reset, "aria-label": activeCopy.reset, onClick: (event) => { event.stopPropagation(); onReset(); } }, "↺") : null,
          h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.vertical, "aria-label": activeCopy.vertical, onClick: (event) => { event.stopPropagation(); onSplit(node.id, "row"); } }, h(LayoutGlyph, { direction: "row", size: 15 })),
          h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.horizontal, "aria-label": activeCopy.horizontal, onClick: (event) => { event.stopPropagation(); onSplit(node.id, "column"); } }, h(LayoutGlyph, { direction: "column", size: 15 })),
          h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.remove, "aria-label": activeCopy.remove, disabled: paneCount <= 1, onClick: (event) => { event.stopPropagation(); onRemove(node.id); } }, "×"),
        ),
      );

      let content;
      if (!node.sessionId) content = h(SessionPicker, { paneId: node.id, list, workspaces, assign: onAssign, createInWorkspace: createWorkspace, creating, activeCopy });
      else if (!available || !session) content = h("div", { className: "dsh-split-picker" }, h("h3", null, activeCopy.unavailable), h("select", { className: "dsh-split-select", defaultValue: "", onChange: (event) => { if (event.currentTarget.value) onAssign(node.id, event.currentTarget.value); } }, h("option", { value: "", disabled: true }, activeCopy.session), sessionOptions(list, workspaces, activeCopy)));
      else content = h(React.Fragment, null,
        waiting ? h("div", { className: "dsh-split-banner" }, activeCopy.waiting, h("button", { type: "button", onClick: () => onOpenMain(node.sessionId) }, activeCopy.openMain)) : null,
        h(MessageList, { session, snapshot, activeCopy }),
        h("form", { className: "dsh-split-compose", onSubmit: (event) => { event.preventDefault(); void send(); } },
          h("div", { className: "dsh-split-compose-row" },
            h("textarea", { rows: 1, value: draft, disabled: snapshot.removed || snapshot.openState !== "open", placeholder: activeCopy.placeholder, "aria-label": activeCopy.placeholder, onChange: (event) => setDraft(event.currentTarget.value), onKeyDown: (event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } } }),
            snapshot.running ? h("button", { type: "button", className: "dsh-split-icon dsh-split-stop", title: activeCopy.stop, "aria-label": activeCopy.stop, onClick: () => void cancel() }, "■") : null,
            h("button", { type: "submit", className: "dsh-split-send", disabled: !canSend, title: activeCopy.send, "aria-label": activeCopy.send }, h(ArrowGlyph)),
          ),
          h("div", { className: "dsh-split-compose-meta", "data-error": Boolean(error) || undefined }, error || (sending ? activeCopy.sending : snapshot.running ? activeCopy.queued : activeCopy.queue)),
        ),
      );

      return h("section", { className: "dsh-split-pane", "data-active": active, "data-drop": drop || undefined, onPointerDown: () => onActive(node.id) },
        header,
        available ? h("div", { className: "dsh-split-session-bar" },
          h("select", { className: "dsh-split-select", value: node.sessionId || "", onChange: (event) => onAssign(node.id, event.currentTarget.value), "aria-label": activeCopy.session }, sessionOptions(list, workspaces, activeCopy)),
          h("select", { className: "dsh-split-select dsh-split-new-select", value: "", disabled: creating, onChange: (event) => { if (event.currentTarget.value) void createWorkspace(node.id, event.currentTarget.value); }, "aria-label": activeCopy.newWorkspace },
            h("option", { value: "" }, creating ? activeCopy.creating : activeCopy.newWorkspace),
            (workspaces.items || []).map((item) => h("option", { value: item.workspaceId, key: item.workspaceId }, item.title)),
          ),
        ) : null,
        h("div", { className: "dsh-split-pane-body", "data-picker": !(node.sessionId && available && session) || undefined }, content),
      );
    }

    function SplitNode({ node, activePane, onRatio, ...paneProps }) {
      const containerRef = React.useRef(null);
      const [dragging, setDragging] = React.useState(false);
      if (node.type === "pane") return h(PaneView, { key: `${node.id}:${node.sessionId || "empty"}`, node, ...paneProps, active: node.id === activePane });
      const startDrag = (event) => {
        event.preventDefault();
        const element = containerRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        setDragging(true);
        const move = (moveEvent) => {
          const ratio = node.direction === "row" ? (moveEvent.clientX - rect.left) / rect.width : (moveEvent.clientY - rect.top) / rect.height;
          onRatio(node.id, ratio);
        };
        const up = () => {
          setDragging(false);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up, { once: true });
      };
      return h("div", { className: "dsh-split-node", "data-direction": node.direction, ref: containerRef },
        h("div", { className: "dsh-split-child", style: { flex: `0 0 ${node.ratio * 100}%` } }, h(SplitNode, { node: node.first, activePane, onRatio, ...paneProps })),
        h("div", { className: "dsh-split-divider", "data-dragging": dragging || undefined, onPointerDown: startDrag, role: "separator", "aria-orientation": node.direction === "row" ? "vertical" : "horizontal" }),
        h("div", { className: "dsh-split-child", style: { flex: "1 1 0" } }, h(SplitNode, { node: node.second, activePane, onRatio, ...paneProps })),

      );
    }

    function SplitScreenEntry({ sessions, workspaces, sessionId }) {
      const activeCopy = copy();
      const list = useObservable(sessions.list, EMPTY_LIST);
      const workspaceList = useObservable(workspaces.list, EMPTY_WORKSPACES);
      const fallback = sessionId || list.current || (list.ids || []).find((id) => list.byId[id] && !list.byId[id].blank) || null;
      const [layout, setLayout] = React.useState(() => loadLayout(fallback));
      const [activePane, setActivePane] = React.useState(() => paneIds(layout)[0]);
      const [notice, setNotice] = React.useState("");
      const autoSeeded = React.useRef(false);
      const mounted = React.useRef(true);
      const count = countPanes(layout);

      React.useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
      }, []);
      React.useEffect(() => saveLayout(layout), [layout]);
      React.useEffect(() => {
        const syncLayout = (event) => {
          const next = sanitizeLayout(event.detail);
          if (next) setLayout(next);
        };
        window.addEventListener(LAYOUT_EVENT, syncLayout);
        return () => window.removeEventListener(LAYOUT_EVENT, syncLayout);
      }, []);
      React.useEffect(() => {
        if (autoSeeded.current || !fallback || countPanes(layout) !== 1 || sessionIds(layout).length > 0) return;
        autoSeeded.current = true;
        setLayout((current) => mapPanes(current, (item) => item.sessionId ? item : { ...item, sessionId: fallback }));
      }, [fallback, layout]);
      React.useEffect(() => {
        if (paneIds(layout).includes(activePane)) return;
        setActivePane(paneIds(layout)[0]);
      }, [layout, activePane]);

      const assign = React.useCallback((paneId, targetSessionId) => {
        const snapshot = sessions.list.getSnapshot();
        if (!targetSessionId || !snapshot.byId[targetSessionId]) return;
        const before = snapshot.current;
        if (targetSessionId !== before) {
          sessions.open(targetSessionId);
          if (before && sessions.list.getSnapshot().byId[before]) sessions.open(before);
        }
        const applyAssignment = (current) => mapPanes(current, (item) => item.id === paneId ? { ...item, sessionId: targetSessionId } : item);
        if (mounted.current) {
          setLayout(applyAssignment);
          setActivePane(paneId);
        } else {
          publishLayout(applyAssignment(loadLayout(sessionId || before || null)));
        }
      }, [sessions, sessionId]);

      const createInWorkspace = React.useCallback(async (paneId, workspaceId) => {
        const targetSessionId = await workspaces.connectWorkspace(workspaceId);
        assign(paneId, targetSessionId);
      }, [workspaces, assign]);

      const split = React.useCallback((paneId, direction) => {
        setNotice("");
        setLayout((current) => {
          if (countPanes(current) >= MAX_PANES) { setNotice(activeCopy.paneLimit); return current; }
          const nextPane = pane();
          setActivePane(nextPane.id);
          return splitPane(current, paneId, direction, nextPane);
        });
      }, [activeCopy.paneLimit]);

      const remove = React.useCallback((paneId) => {
        setLayout((current) => countPanes(current) <= 1 ? current : removePane(current, paneId) || pane());
      }, []);

      React.useEffect(() => {
        const before = sessions.list.getSnapshot().current;
        for (const id of sessionIds(layout)) {
          if (sessions.list.getSnapshot().byId[id]) sessions.open(id);
        }
        if (before && sessions.list.getSnapshot().byId[before]) sessions.open(before);
      }, []);

      React.useEffect(() => {
        const keydown = (event) => {
          if (!event.altKey || !event.shiftKey) return;
          if (event.key.toLowerCase() === "v") { event.preventDefault(); split(activePane, "row"); }
          if (event.key.toLowerCase() === "h") { event.preventDefault(); split(activePane, "column"); }
        };
        window.addEventListener("keydown", keydown);
        return () => window.removeEventListener("keydown", keydown);
      }, [activePane, split]);

      const reset = () => {
        const current = sessions.list.getSnapshot().current || fallback;
        const next = pane(current || null);
        setLayout(next);
        setActivePane(next.id);
        setNotice("");
      };

      const openMain = (targetSessionId) => {
        sessions.open(targetSessionId);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          const scroll = document.querySelector("[data-conversation-scroll]");
          const firstTab = scroll && scroll.previousElementSibling && scroll.previousElementSibling.querySelector('[role="tab"]');
          if (firstTab instanceof HTMLElement) firstTab.click();
        }));
      };

      const paneProps = {
        list,
        workspaces: workspaceList,
        sessions,
        active: false,
        paneCount: count,
        onActive: setActivePane,
        onAssign: assign,
        onCreateWorkspace: createInWorkspace,
        onSplit: split,
        onRemove: remove,
        onReset: reset,
        onSwap: (source, target) => setLayout((current) => swapPaneSessions(current, source, target)),
        onOpenMain: openMain,
        activeCopy,
      };

      return h("div", { className: "dsh-split-workspace-view", "aria-label": activeCopy.title },
        notice ? h("span", { className: "dsh-split-visually-hidden", role: "status" }, notice) : null,
        h("main", { className: "dsh-split-canvas" }, h(SplitNode, {
          node: layout,
          activePane,
          onRatio: (id, ratio) => setLayout((current) => setSplitRatio(current, id, ratio)),
          ...paneProps,
        })),
      );
    }

    const inject = ["slots", "sessions", "workspaces"];
    function apply(ctx) {
      ctx.effect(
        () => ctx.slots.inject("conversation.view", () => ctx.slots.register(
          { name: "conversation.view", id: "split-screen", order: 100, label: () => copy().tab },
          (props) => h(SplitScreenEntry, { ...props, sessions: ctx.sessions, workspaces: ctx.workspaces }),
        )),
        "split-screen: conversation view",
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.__testing = { pane, countPanes, paneIds, sessionIds, splitPane, removePane, setSplitRatio, swapPaneSessions, sanitizeLayout, projectNode, textOfContent, textOfAssistant, loadDraft, saveDraft };
    return module.exports;
  },
});
