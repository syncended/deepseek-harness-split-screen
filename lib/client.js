window.__ModuleLoader__.load({
  id: "@syncended/dsh-split-screen",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const { DisclosureRow, IconApiOutline14, IconThinkOutline14, MarkdownText, MessageText, StateDot } = require("@deepseek-ai/dsh-client-ui-primitives");
    const h = React.createElement;

    const PLUGIN_ID = "@syncended/dsh-split-screen";
    const STYLE_ID = `${PLUGIN_ID}/client.css`;
    const STORAGE_KEY = "dsh.split-screen.layout.v1";
    const ACTIVE_PANE_KEY = "dsh.split-screen.active-pane.v1";
    const DRAFTS_KEY = "dsh.split-screen.drafts.v1";
    const MODE_KEY = "dsh.split-screen.center-mode.v1";
    const LAYOUT_EVENT = "dsh-split-screen:layout";
    const MAX_PANES = 12;
    const MAX_TABS_PER_PANE = 24;
    let focusedComposer = null;

    function rememberComposerFocus(key, input) {
      if (!key || !input) return;
      focusedComposer = {
        key,
        start: Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length,
        end: Number.isInteger(input.selectionEnd) ? input.selectionEnd : input.value.length,
        direction: input.selectionDirection || "none",
      };
    }

    function releaseComposerFocus(key) {
      if (focusedComposer && focusedComposer.key === key) focusedComposer = null;
    }

    function restoreComposerFocus(key, input) {
      if (!input || !focusedComposer || focusedComposer.key !== key) return false;
      const ownerDocument = input.ownerDocument;
      if (!ownerDocument || ownerDocument.activeElement === input) return false;
      const activeElement = ownerDocument.activeElement;
      if (activeElement && activeElement !== ownerDocument.body && activeElement !== ownerDocument.documentElement) return false;
      try {
        input.focus({ preventScroll: true });
        const max = input.value.length;
        input.setSelectionRange(Math.min(focusedComposer.start, max), Math.min(focusedComposer.end, max), focusedComposer.direction);
        return true;
      } catch { return false; }
    }

    function openWithoutNativeSelection(sessions, sessionId) {
      try {
        const before = sessions.list.getSnapshot().current;
        sessions.open(sessionId);
        if (before && before !== sessionId && sessions.list.getSnapshot().byId[before]) sessions.open(before);
      } catch (error) { console.warn("dsh split-screen: could not open pane session", error); }
    }
    const EMPTY_LIST = Object.freeze({
      ids: Object.freeze([]),
      byId: Object.freeze({}),
      current: undefined,
      phase: "pending",
      subagentsByParent: Object.freeze({}),
      jobsBySession: Object.freeze({}),
      currentAddress: undefined,
    });
    const EMPTY_LOCALE = Object.freeze({ active: "en", locales: Object.freeze([]), revision: 0 });
    const EMPTY_MODEL_DIRECTORY = Object.freeze({
      current: null,
      routable: null,
      groups: Object.freeze([]),
      failures: Object.freeze([]),
      status: "idle",
      error: null,
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
      runningCalls: Object.freeze([]),
      turnTimings: new Map(),
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
  --dsh-split-accent: var(--dsw-alias-state-business-primary, #4176e6);
  --dsh-split-accent-soft: var(--dsw-alias-interactive-bg-hover, rgba(38,49,72,.06));
  --dsh-split-bg: var(--dsw-alias-bg-base, #fff);
  --dsh-split-panel: var(--dsw-alias-bg-base, #fff);
  --dsh-split-panel-2: var(--dsw-specific-input-major, #fff);
  --dsh-split-tip: var(--dsw-specific-tip, #f5f6f7);
  --dsh-split-border: var(--dsw-alias-border-l2, rgba(0,0,0,.10));
  --dsh-split-border-soft: var(--dsw-alias-border-l1, rgba(0,0,0,.04));
  --dsh-split-text: var(--dsw-alias-label-primary, #0f1115);
  --dsh-split-secondary: var(--dsw-alias-label-secondary, #61666b);
  --dsh-split-muted: var(--dsw-alias-label-tertiary, #81858c);
  --dsh-split-caption: var(--dsw-alias-label-caption, #adb2b8);
  --dsh-split-danger: var(--dsw-alias-state-error-primary, #ec1313);
  --dsh-split-warn: var(--dsw-alias-state-warn-primary, #f59e0b);
  --dsh-split-success: var(--dsw-alias-state-success-primary, #22c55e);
  --dsh-split-shadow: var(--dsw-shadow-lv2, 0 4px 18px rgba(15,23,42,.08));
  --dsh-chat-content-width: 748px;
  --dsh-composer-card-max-width: calc(var(--dsh-chat-content-width) + 32px);
}
.dsh-split-workspace-view {
  width:100%; height:100%; min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden;
  color:var(--dsh-split-text); background:var(--dsh-split-bg);
  font:13px/1.45 Inter,var(--dsw-font-family),ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
.dsh-split-workspace-toolbar { box-sizing:border-box; width:100%; height:44px; flex:none; display:flex; align-items:center; gap:8px; padding:6px 10px 6px 14px; border-bottom:1px solid var(--dsh-split-border); background:var(--dsh-split-panel); }
.dsh-split-workspace-mark { width:8px; height:8px; flex:none; border-radius:3px; background:var(--dsh-split-accent); box-shadow:7px 0 0 color-mix(in srgb,var(--dsh-split-accent) 46%,transparent); }
.dsh-split-workspace-title { min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:600; }
.dsh-split-workspace-exit { height:30px; display:inline-flex; align-items:center; gap:6px; padding:0 10px; border:0; border-radius:9px; color:var(--dsh-split-secondary); background:transparent; cursor:pointer; font:12px/18px inherit; }
.dsh-split-workspace-exit:hover { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
div[data-slot="sidebar.footer.action"]:has(.dsh-split-sidebar-toggle) { display:flex!important; flex-direction:column; align-items:stretch; width:100%; min-width:0; }
div[data-slot="sidebar.footer.action"]:has(.dsh-split-sidebar-toggle:not([data-wide="true"])) { align-items:center; width:auto; }
.dsh-split-sidebar-toggle { box-sizing:border-box; width:36px; height:36px; flex:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:0; border:0; border-radius:50%; color:var(--dsw-alias-label-primary,#0f1115); background:transparent; cursor:pointer; font:14px/22px Inter,var(--dsw-font-family),sans-serif; }
.dsh-split-sidebar-toggle[data-wide="true"] { width:100%; height:49px; padding:0 8px 0 6px; border-radius:12px; justify-content:flex-start; }
.dsh-split-sidebar-toggle:hover,.dsh-split-sidebar-toggle[data-active="true"] { color:var(--dsw-alias-label-primary,#0f1115); background:var(--dsw-specific-sidebar-nav-item-hover,var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))); }
.dsh-split-sidebar-toggle[data-active="true"] { color:var(--dsw-alias-state-business-primary,#4176e6); }
.dsh-split-sidebar-toggle svg { width:18px; height:18px; flex:none; }
.dsh-split-sidebar-toggle[data-wide="true"] svg { width:14px; height:14px; }
.dsh-split-sidebar-label { white-space:nowrap; }
.dsh-split-visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.dsh-split-canvas { width:100%; min-width:0; min-height:0; flex:1; overflow:hidden; background:var(--dsh-split-bg); }
.dsh-split-node { width:100%; height:100%; min-width:0; min-height:0; display:flex; overflow:hidden; }
.dsh-split-node[data-direction="row"] { flex-direction:row; }
.dsh-split-node[data-direction="column"] { flex-direction:column; }
.dsh-split-child { min-width:0; min-height:0; overflow:hidden; }
.dsh-split-divider { position:relative; z-index:4; flex:none; touch-action:none; background:var(--dsh-split-border); }
.dsh-split-node[data-direction="row"] > .dsh-split-divider { width:1px; cursor:col-resize; }
.dsh-split-node[data-direction="column"] > .dsh-split-divider { height:1px; cursor:row-resize; }
.dsh-split-divider:after { content:""; position:absolute; inset:-5px; background:transparent; transition:background 120ms ease; }
.dsh-split-divider:hover:after,.dsh-split-divider[data-dragging]:after { background:color-mix(in srgb,var(--dsh-split-accent) 16%,transparent); }
.dsh-split-pane { container:dsh-split-pane / inline-size; position:relative; width:100%; height:100%; min-width:220px; min-height:160px; display:flex; flex-direction:column; overflow:hidden; background:var(--dsh-split-panel); }
.dsh-split-pane-body { min-width:0; min-height:0; flex:1; display:grid; grid-template-rows:minmax(0,1fr) auto; overflow:hidden; }
.dsh-split-pane-body[data-waiting="true"] { grid-template-rows:auto minmax(0,1fr) auto; }
.dsh-split-pane-body[data-picker="true"] { display:block; }
.dsh-split-pane[data-drop="true"] { box-shadow:inset 0 0 0 2px var(--dsh-split-accent); }
.dsh-split-pane-header { position:relative; z-index:3; min-width:0; height:44px; box-sizing:border-box; display:flex; align-items:center; gap:8px; padding:6px 8px 6px 12px; border-bottom:1px solid var(--dsh-split-border); background:var(--dsh-split-panel); cursor:grab; }
.dsh-split-pane[data-active="true"] > .dsh-split-pane-header:after { content:""; position:absolute; right:10px; bottom:-1px; left:10px; height:2px; border-radius:2px; background:var(--dsh-split-accent); }
.dsh-split-pane-header:active { cursor:grabbing; }
.dsh-split-status-dot { width:6px; height:6px; flex:none; border-radius:50%; background:var(--dsh-split-caption); }
.dsh-split-status-dot[data-state="running"] { background:var(--dsh-split-accent); }
.dsh-split-status-dot[data-state="waiting"] { background:var(--dsh-split-warn); }
.dsh-split-status-dot[data-state="done"] { background:var(--dsh-split-success); }
.dsh-split-title { min-width:0; flex:1; overflow:hidden; color:var(--dsh-split-text); text-overflow:ellipsis; white-space:nowrap; font-size:13px; font-weight:500; line-height:20px; }
.dsh-split-workspace { min-width:0; max-width:30%; overflow:hidden; color:var(--dsh-split-muted); text-overflow:ellipsis; white-space:nowrap; font-size:11px; line-height:18px; }
.dsh-split-tabs { min-width:0; flex:1; display:flex; align-items:center; gap:3px; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; }
.dsh-split-tabs::-webkit-scrollbar { display:none; }
.dsh-split-tab { min-width:42px; max-width:180px; height:30px; display:flex; align-items:center; border-radius:9px; color:var(--dsh-split-muted); background:transparent; overflow:hidden; }
.dsh-split-tab[data-active="true"] { color:var(--dsh-split-text); background:var(--dsh-split-tip); }
.dsh-split-tab-main { min-width:0; height:100%; flex:1; display:flex; align-items:center; gap:6px; padding:0 4px 0 8px; border:0; color:inherit; background:transparent; cursor:pointer; font:11px/18px inherit; }
.dsh-split-tab-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-split-tab-close { width:22px; height:22px; flex:none; display:grid; place-items:center; padding:0; border:0; border-radius:50%; color:var(--dsh-split-muted); background:transparent; cursor:pointer; opacity:0; }
.dsh-split-tab:hover .dsh-split-tab-close,.dsh-split-tab[data-active="true"] .dsh-split-tab-close,.dsh-split-tab-close:focus-visible { opacity:1; }
.dsh-split-tab-close:hover { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
.dsh-split-tab-add { position:sticky; right:0; z-index:2; width:28px; height:28px; flex:none; display:grid; place-items:center; padding:0; border:0; border-radius:50%; color:var(--dsh-split-muted); background:var(--dsh-split-panel); cursor:pointer; font-size:18px; line-height:28px; }
.dsh-split-tab-add:hover { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
.dsh-split-tab-picker { position:absolute; z-index:20; top:37px; left:10px; width:min(260px,calc(100% - 20px)); max-height:280px; display:flex; flex-direction:column; gap:2px; padding:5px; overflow:auto; border:1px solid var(--dsh-split-border); border-radius:12px; background:var(--dsh-split-panel-2); box-shadow:var(--dsh-split-shadow); }
.dsh-split-tab-option { min-height:34px; display:flex; align-items:center; gap:7px; padding:4px 8px; border:0; border-radius:8px; color:var(--dsh-split-text); background:transparent; cursor:pointer; text-align:left; font:12px/18px inherit; }
.dsh-split-tab-option:hover { background:var(--dsh-split-accent-soft); }
.dsh-split-tab-option-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-split-header-actions { display:flex; align-items:center; gap:1px; opacity:.32; transition:opacity 120ms ease; }
.dsh-split-pane:hover .dsh-split-header-actions,.dsh-split-pane[data-active="true"] .dsh-split-header-actions,.dsh-split-header-actions:focus-within { opacity:1; }
.dsh-split-header-action { width:28px; height:28px; flex:none; display:grid; place-items:center; padding:0; border:0; border-radius:50%; color:var(--dsh-split-muted); background:transparent; cursor:pointer; }
.dsh-split-header-action:hover { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
.dsh-split-header-action:disabled { opacity:.35; cursor:not-allowed; }
.dsh-split-button,.dsh-split-compose textarea { box-sizing:border-box; color:var(--dsh-split-text); border:1px solid var(--dsh-split-border); background:var(--dsh-split-panel-2); font:inherit; }
.dsh-split-button { min-height:30px; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:4px 10px; border-radius:9px; cursor:pointer; }
.dsh-split-button:hover { background:var(--dsh-split-accent-soft); }
.dsh-split-button:disabled { opacity:.45; cursor:not-allowed; }
.dsh-split-transcript { min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain; padding:16px 32px 24px; scrollbar-width:thin; }
.dsh-split-flow { width:100%; max-width:var(--dsh-chat-content-width); min-height:100%; margin:0 auto; display:flex; flex-direction:column; gap:16px; }
.dsh-split-empty { min-height:110px; flex:1; display:grid; place-items:center; padding:24px; color:var(--dsh-split-muted); text-align:center; font-size:13px; line-height:20px; }
.dsh-split-message { min-width:0; max-width:100%; padding:0; border:0; overflow-wrap:anywhere; color:var(--dsh-split-text); background:transparent; }
.dsh-split-message[data-role="assistant"] { font-size:16px; line-height:28px; }
.dsh-split-assistant-blocks { min-width:0; display:flex; flex-direction:column; gap:16px; }
.dsh-split-reasoning,.dsh-split-tool { min-width:0; border-radius:6px; color:var(--dsh-split-secondary); font-size:14px; line-height:24px; }
.dsh-split-disclosure { min-width:0; display:flex; flex-direction:column; }
.dsh-split-disclosure-row { position:relative; min-width:0; min-height:24px; display:flex; align-items:center; border-radius:6px; padding:0 3px; overflow:hidden; font-size:14px; line-height:24px; }
.dsh-split-disclosure-row[data-expandable] { cursor:pointer; }
.dsh-split-disclosure-row[data-expandable]:hover { background:var(--dsh-split-accent-soft); }
.dsh-split-disclosure-leading { width:16px; height:16px; flex:none; display:grid; place-items:center; margin-right:6px; color:var(--dsh-split-muted); }
.dsh-split-disclosure-chevron { color:var(--dsw-alias-label-secondary,var(--dsh-split-muted)); transition:transform 120ms ease; }
.dsh-split-disclosure[data-open] .dsh-split-disclosure-chevron { transform:rotate(180deg); }
.dsh-split-disclosure-title { flex:none; color:var(--dsw-alias-label-primary,var(--dsh-split-text)); font-weight:400; }
.dsh-split-disclosure-separator { width:2px; height:2px; flex:none; margin:0 8px; border-radius:1px; background:var(--dsw-alias-label-caption,var(--dsh-split-muted)); }
.dsh-split-disclosure-summary { min-width:0; flex:auto; overflow:hidden; color:var(--dsw-alias-label-tertiary,var(--dsh-split-muted)); text-overflow:ellipsis; white-space:nowrap; font-size:14px; line-height:24px; }
.dsh-split-disclosure-summary[data-error] { color:var(--dsh-split-danger); }
.dsh-split-disclosure-body,.dsh-split-reasoning-body { max-height:320px; margin:4px 0 2px 25px; padding:0; overflow:auto; border:0; color:var(--dsh-split-muted); background:transparent; white-space:pre-wrap; overflow-wrap:anywhere; font:13px/22px Inter,var(--dsw-font-family),sans-serif; }
.dsh-split-tool .dsh-split-disclosure-body,.dsh-split-tool-body { max-height:240px; margin:5px 0 2px 4px; overflow:auto; border:1px solid var(--dsh-split-border); border-radius:12px; background:color-mix(in srgb,var(--dsh-split-tip) 74%,var(--dsh-split-bg)); font:11px/18px var(--ds-font-family-code),ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-split-tool .dsh-split-disclosure-body { padding:10px 12px; }
.dsh-split-tool-section { display:grid; grid-template-columns:max-content minmax(0,1fr); gap:8px; padding:9px 10px; }
.dsh-split-tool-section + .dsh-split-tool-section { border-top:1px solid var(--dsh-split-border); }
.dsh-split-tool-section-label { color:var(--dsh-split-muted); font-size:9px; text-transform:uppercase; }
.dsh-split-tool-section-text { min-width:0; margin:0; white-space:pre-wrap; overflow-wrap:anywhere; font:inherit; }
.dsh-split-tool-section-text[data-error="true"] { color:var(--dsh-split-danger); }
.dsh-split-tool-children { display:flex; flex-direction:column; gap:4px; margin:4px 0 2px 22px; padding-left:8px; border-left:1px solid var(--dsh-split-border); }
.dsh-split-tool[data-state="running"] .dsh-split-disclosure-leading { color:var(--dsh-split-accent); }
.dsh-split-reasoning[data-state="running"] .dsh-split-disclosure-row:after,.dsh-split-tool[data-state="running"] .dsh-split-disclosure-row:after { content:""; position:absolute; inset-block:0; left:-300px; width:300px; pointer-events:none; background:linear-gradient(90deg,transparent 0%,color-mix(in srgb,var(--dsh-split-bg) 62%,transparent) 55%,transparent 100%); animation:dsh-split-row-sweep 2.6s ease-out infinite; }
@keyframes dsh-split-row-sweep { 90%,100% { left:100%; } }
.dsh-split-image-label { color:var(--dsh-split-muted); font-size:13px; }
.dsh-split-message-stopped { align-self:flex-start; padding:0 6px; border-radius:6px; color:var(--dsh-split-muted); background:var(--dsh-split-tip); font-size:10px; line-height:18px; }
.dsh-split-message[data-role="user"] { width:fit-content; max-width:min(525px,82%); margin-left:auto; padding:10px 16px; border-radius:22px; background:var(--dsw-specific-bubble,var(--dsh-split-tip)); font-size:16px; line-height:24px; white-space:pre-wrap; }
.dsh-split-message[data-role="system"] { padding:2px 0; color:var(--dsh-split-muted); font-size:13px; line-height:20px; white-space:pre-wrap; }
.dsh-split-message[data-role="error"] { padding:8px 10px; border-radius:10px; color:var(--dsh-split-danger); background:var(--dsw-alias-interactive-bg-hover-danger,rgba(236,19,19,.05)); font-size:13px; line-height:20px; white-space:pre-wrap; }
.dsh-split-stream { opacity:.9; }
.dsh-split-turn-status { height:26px; flex:none; align-self:flex-start; display:inline-flex; align-items:center; color:transparent; -webkit-text-fill-color:transparent; background:linear-gradient(90deg,var(--dsw-static-deepseek-500,var(--dsh-split-accent)) 0%,var(--dsw-static-deepseek-500,var(--dsh-split-accent)) 40%,var(--dsw-static-deepseek-200,#d3e2ff) 50%,var(--dsw-static-deepseek-500,var(--dsh-split-accent)) 60%,var(--dsw-static-deepseek-500,var(--dsh-split-accent)) 100%); background-position:100% 0; background-size:250% 100%; -webkit-background-clip:text; background-clip:text; animation:dsh-split-turn-status 1.8s linear infinite; white-space:nowrap; font-size:14px; font-weight:600; line-height:26px; }
.dsh-split-turn-status-clock { margin-left:8px; color:var(--dsh-split-caption); -webkit-text-fill-color:var(--dsh-split-caption); font-size:13px; font-weight:400; font-variant-numeric:tabular-nums; }
@keyframes dsh-split-turn-status { to { background-position:0 0; } }
.dsh-split-history { display:flex; justify-content:center; }
.dsh-split-banner { min-height:32px; display:flex; align-items:center; gap:7px; padding:5px 10px; color:var(--dsw-alias-state-warn-label,var(--dsh-split-warn)); background:var(--dsw-alias-state-warn-tertiary,rgba(245,158,11,.10)); border-bottom:1px solid var(--dsw-alias-state-warn-secondary,rgba(245,158,11,.24)); font-size:11px; }
.dsh-split-banner button { margin-left:auto; border:0; color:inherit; background:transparent; text-decoration:underline; cursor:pointer; }
.dsh-split-compose { position:relative; z-index:2; padding:8px 16px 12px; border:0; background:linear-gradient(180deg,transparent,var(--dsh-split-panel) 18%); }
.dsh-split-compose-card { box-sizing:border-box; width:100%; max-width:var(--dsh-composer-card-max-width); min-width:0; display:flex; flex-direction:column; gap:4px; margin:0 auto; padding:10px 10px 8px 14px; border:1px solid var(--dsw-alias-border-l2-darkmode-thin,var(--dsh-split-border)); border-radius:22px; background:var(--dsh-split-panel-2); box-shadow:var(--dsh-split-shadow); }
.dsh-split-compose-card:focus-within { border-color:color-mix(in srgb,var(--dsh-split-accent) 58%,var(--dsh-split-border)); box-shadow:0 0 0 2px color-mix(in srgb,var(--dsh-split-accent) 14%,transparent),var(--dsh-split-shadow); }
.dsh-split-compose textarea { box-sizing:border-box; width:100%; min-width:0; min-height:42px; max-height:120px; resize:none; padding:1px 2px 6px; border:0; border-radius:0; outline:0; color:var(--dsh-split-text); background:transparent; font:16px/24px Inter,var(--dsw-font-family),sans-serif; }
.dsh-split-compose textarea::placeholder { color:var(--dsh-split-caption); }
.dsh-split-compose-footer { min-width:0; min-height:32px; display:flex; align-items:center; gap:8px; }
.dsh-split-compose-controls { min-width:0; flex:1; display:flex; align-items:center; gap:3px; overflow:visible; }
.dsh-split-control-selector,.dsh-split-context-control { position:relative; min-width:0; flex:none; }
.dsh-split-control-selector[data-open="true"],.dsh-split-context-control[data-open="true"] { z-index:50; }
.dsh-split-control-trigger { box-sizing:border-box; min-width:28px; max-width:176px; height:28px; display:flex; align-items:center; gap:5px; padding:0 6px; border:0; border-radius:14px; outline:0; color:var(--dsh-split-secondary); background:transparent; cursor:pointer; font:500 11px/18px Inter,var(--dsw-font-family),sans-serif; }
.dsh-split-control-selector[data-kind="permission"] .dsh-split-control-trigger { max-width:122px; }
.dsh-split-control-trigger:hover:not(:disabled),.dsh-split-control-trigger[aria-expanded="true"] { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
.dsh-split-control-trigger:focus-visible,.dsh-split-context-trigger:focus-visible { outline:2px solid var(--dsh-split-accent); outline-offset:1px; }
.dsh-split-control-trigger:disabled { opacity:.5; cursor:not-allowed; }
.dsh-split-control-icon { width:15px; height:15px; flex:none; display:grid; place-items:center; }
.dsh-split-control-icon svg { width:15px; height:15px; }
.dsh-split-control-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-split-control-chevron { width:11px; height:11px; flex:none; transition:transform 120ms ease; }
.dsh-split-control-trigger[aria-expanded="true"] .dsh-split-control-chevron { transform:rotate(180deg); }
.dsh-split-control-menu { position:absolute; z-index:50; bottom:calc(100% + 7px); left:0; box-sizing:border-box; width:min(236px,calc(100cqw - 20px)); max-height:min(320px,calc(100vh - 110px)); padding:4px; overflow-y:auto; overscroll-behavior:contain; border:1px solid var(--dsh-split-border); border-radius:12px; color:var(--dsh-split-text); background:var(--dsh-split-panel-2); box-shadow:0 16px 42px rgba(0,0,0,.20); }
.dsh-split-control-selector[data-kind="model"] .dsh-split-control-menu { left:auto; right:0; }
.dsh-split-control-group + .dsh-split-control-group { margin-top:3px; padding-top:3px; border-top:1px solid var(--dsh-split-border); }
.dsh-split-control-group-label { padding:5px 8px 3px; color:var(--dsh-split-muted); font-size:10px; font-weight:600; line-height:14px; }
.dsh-split-control-option { box-sizing:border-box; width:100%; min-height:34px; display:flex; align-items:center; gap:8px; padding:6px 8px; border:0; border-radius:8px; color:var(--dsh-split-text); background:transparent; text-align:left; cursor:pointer; font:500 12px/18px Inter,var(--dsw-font-family),sans-serif; }
.dsh-split-control-option:hover:not(:disabled),.dsh-split-control-option:focus-visible,.dsh-split-control-option[aria-checked="true"] { outline:0; background:var(--dsh-split-accent-soft); }
.dsh-split-control-option:disabled { opacity:.45; cursor:not-allowed; }
.dsh-split-control-option-label { min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-split-control-check { width:15px; height:15px; flex:none; color:var(--dsh-split-accent); opacity:0; }
.dsh-split-control-option[aria-checked="true"] .dsh-split-control-check { opacity:1; }
.dsh-split-context-trigger { box-sizing:border-box; height:28px; display:inline-flex; align-items:center; gap:5px; padding:0 6px; border:0; border-radius:14px; color:var(--dsh-split-muted); background:transparent; cursor:pointer; font:500 10px/28px Inter,var(--dsw-font-family),sans-serif; font-variant-numeric:tabular-nums; }
.dsh-split-context-trigger:hover,.dsh-split-context-trigger[aria-expanded="true"] { color:var(--dsh-split-text); background:var(--dsh-split-accent-soft); }
.dsh-split-context-ring { width:16px; height:16px; }
.dsh-split-context-track,.dsh-split-context-fill { fill:none; stroke-width:2; }
.dsh-split-context-track { stroke:color-mix(in srgb,var(--dsh-split-muted) 24%,transparent); }
.dsh-split-context-fill { stroke:var(--dsh-split-accent); stroke-linecap:round; }
.dsh-split-context-control[data-pressure="warning"] .dsh-split-context-fill { stroke:var(--dsh-split-warn); }
.dsh-split-context-control[data-pressure="critical"] .dsh-split-context-fill { stroke:var(--dsh-split-danger); }
.dsh-split-context-popover { position:absolute; z-index:50; right:0; bottom:calc(100% + 7px); box-sizing:border-box; width:min(210px,calc(100cqw - 20px)); padding:10px; border:1px solid var(--dsh-split-border); border-radius:12px; color:var(--dsh-split-text); background:var(--dsh-split-panel-2); box-shadow:0 16px 42px rgba(0,0,0,.20); font-size:11px; line-height:18px; }
.dsh-split-context-popover-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:7px; font-weight:600; }
.dsh-split-context-popover-percent { color:var(--dsh-split-accent); font-variant-numeric:tabular-nums; }
.dsh-split-context-bar { height:5px; overflow:hidden; border-radius:999px; background:var(--dsh-split-border); }
.dsh-split-context-bar > span { height:100%; display:block; border-radius:inherit; background:var(--dsh-split-accent); }
.dsh-split-context-popover[data-pressure="warning"] .dsh-split-context-bar > span { background:var(--dsh-split-warn); }
.dsh-split-context-popover[data-pressure="critical"] .dsh-split-context-bar > span { background:var(--dsh-split-danger); }
.dsh-split-context-rows { display:grid; grid-template-columns:1fr auto; gap:2px 10px; margin-top:8px; color:var(--dsh-split-muted); }
.dsh-split-context-rows strong { color:var(--dsh-split-text); font-weight:500; font-variant-numeric:tabular-nums; }
.dsh-split-compose-meta { box-sizing:border-box; width:100%; min-width:0; overflow:hidden; color:var(--dsh-split-muted); text-overflow:ellipsis; white-space:nowrap; font-size:11px; line-height:18px; }
.dsh-split-stats { box-sizing:border-box; width:100%; max-width:var(--dsh-chat-content-width); min-height:18px; display:flex; flex-wrap:wrap; justify-content:center; gap:0 14px; margin:0 auto; padding:4px 10px 0; overflow:hidden; color:var(--dsh-split-muted); font-size:10px; line-height:16px; font-variant-numeric:tabular-nums; }
.dsh-split-stat { white-space:nowrap; }
.dsh-split-compose-meta[data-error="true"] { color:var(--dsh-split-danger); }
.dsh-split-send { width:32px; height:32px; flex:none; display:grid; place-items:center; border:0; border-radius:50%; color:var(--dsw-alias-label-primary-foreground,#fff); background:var(--dsw-alias-button-info-fill,var(--dsh-split-accent)); cursor:pointer; }
.dsh-split-send:hover:not(:disabled) { background:var(--dsw-alias-button-info-hover,#679efe); }
.dsh-split-send[data-stop="true"] { background:var(--dsh-split-text); }
.dsh-split-send[data-stop="true"]:before { content:""; width:9px; height:9px; border-radius:2px; background:var(--dsh-split-bg); }
.dsh-split-send[data-stop="true"] svg { display:none; }
.dsh-split-send:disabled { color:var(--dsh-split-muted); background:var(--dsh-split-tip); opacity:.72; cursor:not-allowed; }
.dsh-split-picker { height:100%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:12px; padding:28px; }
.dsh-split-picker h3,.dsh-split-picker p { max-width:420px; margin:0; text-align:center; }
.dsh-split-picker h3 { font-size:15px; font-weight:550; }
.dsh-split-picker p { color:var(--dsh-split-muted); }
.dsh-split-button:focus-visible,.dsh-split-header-action:focus-visible,.dsh-split-send:focus-visible { outline:2px solid var(--dsh-split-accent); outline-offset:2px; }
@container dsh-split-pane (max-width:520px) {
  .dsh-split-transcript { padding:14px 18px 20px; }
  .dsh-split-compose { padding:8px 12px 10px; }
  .dsh-split-workspace { display:none; }
}
@container dsh-split-pane (max-width:420px) {
  .dsh-split-pane-header { height:40px; padding-inline:9px 6px; }
  .dsh-split-header-actions { gap:0; }
  .dsh-split-header-action { width:26px; height:26px; }
  .dsh-split-transcript { padding:12px 12px 18px; }
  .dsh-split-flow { gap:12px; }
  .dsh-split-message[data-role="assistant"] { font-size:15px; line-height:24px; }
  .dsh-split-message[data-role="user"] { max-width:88%; padding:9px 14px; font-size:15px; line-height:22px; }
  .dsh-split-compose { padding-inline:10px; }
  .dsh-split-compose-card { padding:9px 8px 7px 12px; }
  .dsh-split-compose textarea { min-height:38px; font-size:15px; line-height:22px; }
  .dsh-split-control-trigger { width:28px; padding:0; justify-content:center; }
  .dsh-split-control-label,.dsh-split-control-chevron,.dsh-split-context-label { display:none; }
  .dsh-split-compose-meta:not([data-error="true"]) { display:none; }
}
@media (max-width:760px) { .dsh-split-pane{min-width:180px}.dsh-split-picker{padding:18px} }
@media (prefers-reduced-motion:reduce) { .dsh-split-status-dot,.dsh-split-header-actions,.dsh-split-reasoning[data-state="running"] .dsh-split-disclosure-row:after,.dsh-split-tool[data-state="running"] .dsh-split-disclosure-row:after,.dsh-split-turn-status { animation:none!important; transition:none!important; } }
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

    function normalizePaneTabs(tabs, sessionId) {
      const output = [];
      for (const value of Array.isArray(tabs) ? tabs : []) {
        if (typeof value === "string" && value && !output.includes(value) && output.length < MAX_TABS_PER_PANE) output.push(value);
      }
      if (typeof sessionId === "string" && sessionId && !output.includes(sessionId)) output.unshift(sessionId);
      return output.slice(0, MAX_TABS_PER_PANE);
    }

    function pane(sessionId = null, id = uid("pane"), tabs) {
      const normalizedTabs = normalizePaneTabs(tabs, sessionId);
      const active = typeof sessionId === "string" && normalizedTabs.includes(sessionId) ? sessionId : normalizedTabs[0] || null;
      return { type: "pane", id, sessionId: active, tabs: normalizedTabs };
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
        for (const sessionId of normalizePaneTabs(node.tabs, node.sessionId)) {
          if (!output.includes(sessionId)) output.push(sessionId);
        }
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
        if (item.id === firstId) a = { sessionId: item.sessionId, tabs: normalizePaneTabs(item.tabs, item.sessionId) };
        if (item.id === secondId) b = { sessionId: item.sessionId, tabs: normalizePaneTabs(item.tabs, item.sessionId) };
        return item;
      });
      if (!a || !b) return node;
      return mapPanes(node, (item) => item.id === firstId ? { ...item, ...b } : item.id === secondId ? { ...item, ...a } : item);
    }

    function setPaneSession(node, paneId, sessionId, add = true) {
      if (!paneId || typeof sessionId !== "string" || !sessionId) return node;
      return mapPanes(node, (item) => {
        if (item.id !== paneId) return item;
        const tabs = normalizePaneTabs(add ? [...(item.tabs || []), sessionId] : item.tabs, sessionId);
        return item.sessionId === sessionId && tabs.length === (item.tabs || []).length ? item : { ...item, sessionId, tabs };
      });
    }

    function closePaneSession(node, paneId, sessionId) {
      return mapPanes(node, (item) => {
        if (item.id !== paneId) return item;
        const before = normalizePaneTabs(item.tabs, item.sessionId);
        const index = before.indexOf(sessionId);
        if (index < 0) return item;
        const tabs = before.filter((value) => value !== sessionId);
        const active = item.sessionId === sessionId ? tabs[Math.min(index, tabs.length - 1)] || null : item.sessionId;
        return { ...item, sessionId: active, tabs };
      });
    }

    function paneForSession(node, sessionId) {
      if (!node || !sessionId) return null;
      if (node.type === "pane") return normalizePaneTabs(node.tabs, node.sessionId).includes(sessionId) ? node.id : null;
      return paneForSession(node.first, sessionId) || paneForSession(node.second, sessionId);
    }

    function sessionForPane(node, paneId) {
      if (!node || !paneId) return null;
      if (node.type === "pane") return node.id === paneId ? node.sessionId || null : null;
      return sessionForPane(node.first, paneId) || sessionForPane(node.second, paneId);
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
          return pane(typeof node.sessionId === "string" ? node.sessionId : null, node.id, node.tabs);
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

    function loadActivePane(layout) {
      const ids = paneIds(layout);
      try {
        const stored = localStorage.getItem(ACTIVE_PANE_KEY);
        if (stored && ids.includes(stored)) return stored;
      } catch {}
      return ids[0];
    }

    function saveActivePane(paneId) {
      try { localStorage.setItem(ACTIVE_PANE_KEY, paneId); }
      catch (error) { console.warn("dsh split-screen: could not persist active pane", error); }
    }

    function loadCenterMode() {
      try { return localStorage.getItem(MODE_KEY) === "true"; }
      catch { return false; }
    }

    function saveCenterMode(active) {
      try { localStorage.setItem(MODE_KEY, active ? "true" : "false"); }
      catch (error) { console.warn("dsh split-screen: could not persist center mode", error); }
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

    const COPY = {
      en: {
        tab: "Split", title: "Split workspace", exitSplit: "Back to Chat", addTab: "Add chat tab", closeTab: "Close chat tab",
        vertical: "Split vertically", horizontal: "Split horizontally", reset: "Reset layout",
        choose: "Select a session in the sidebar", chooseHint: "This pane is focused. Use the native session list on the left to attach a conversation here.",
        noSession: "Empty pane", newWorkspace: "New in workspace…", session: "Session…", remove: "Close pane",
        drag: "Drag this header onto another pane to swap them", loading: "Loading conversation…", empty: "No messages yet.",
        user: "You", agent: "Agent", system: "Status", tool: "Tool", image: "[Image]", reasoning: "Reasoning",
        toolDone: "Completed", toolFailed: "Failed", input: "Input", output: "Output",
        model: "Model", access: "Access", context: "Context", contextUsed: "Used", contextLimit: "Limit", contextRemaining: "Remaining", turns: "turns", steps: "steps", tokensPerSecond: "tok/s", cache: "cache",
        permissionFailed: "Could not change access mode.", modelFailed: "Could not change model.", fullAccessConfirm: "Enable Full access? This allows sensitive operations with fewer confirmations.",
        placeholder: "Message this session…", send: "Send", stop: "Stop", sending: "Sending…",
        queue: "Enter to send · Shift+Enter for a new line", queued: "The message will be queued after the current turn",
        working: "Agent is working", deepDiving: "Deep diving…", thinking: "Thinking", toolRunning: "Running", durationSeconds: "{seconds}s", durationMinutes: "{minutes}m {seconds}s",
        waiting: "This session needs structured input in the main view", openMain: "Open main view",
        unavailable: "This session is unavailable. Pick another one.", loadOlder: "Load older messages", creating: "Creating session…",
        retry: "The model request is being retried.", maxTokens: "The response reached its output limit.", interrupted: "Response stopped",
        unknownError: "The operation failed.", paneLimit: "Maximum 12 panes", swapHint: "Drop to swap sessions",
      },
      ru: {
        tab: "Сплит", title: "Split workspace", exitSplit: "Вернуться в чат", addTab: "Добавить вкладку чата", closeTab: "Закрыть вкладку чата",
        vertical: "Разделить вертикально", horizontal: "Разделить горизонтально", reset: "Сбросить раскладку",
        choose: "Выберите сессию в боковой панели", chooseHint: "Эта панель активна. Выберите диалог в стандартном списке сессий слева.",
        noSession: "Пустая панель", newWorkspace: "Создать в проекте…", session: "Сессия…", remove: "Закрыть панель",
        drag: "Перетащите заголовок на другую панель, чтобы поменять сессии местами", loading: "Загружаем переписку…", empty: "Сообщений пока нет.",
        user: "Вы", agent: "Агент", system: "Статус", tool: "Инструмент", image: "[Изображение]", reasoning: "Размышления",
        toolDone: "Завершено", toolFailed: "Ошибка", input: "Вход", output: "Выход",
        model: "Модель", access: "Доступ", context: "Контекст", contextUsed: "Использовано", contextLimit: "Лимит", contextRemaining: "Осталось", turns: "ходов", steps: "шагов", tokensPerSecond: "ток/с", cache: "кэш",
        permissionFailed: "Не удалось изменить режим доступа.", modelFailed: "Не удалось изменить модель.", fullAccessConfirm: "Включить Full access? Этот режим разрешает чувствительные операции с меньшим числом подтверждений.",
        placeholder: "Ответить агенту…", send: "Отправить", stop: "Остановить", sending: "Отправляем…",
        queue: "Enter — отправить · Shift+Enter — новая строка", queued: "Ответ будет поставлен в очередь после текущего хода",
        working: "Агент работает", deepDiving: "Погружаюсь глубже…", thinking: "Размышляет", toolRunning: "Выполняется", durationSeconds: "{seconds} с", durationMinutes: "{minutes} мин {seconds} с",
        waiting: "Сессия ждёт структурированного ответа в основном окне", openMain: "Открыть основной вид",
        unavailable: "Сессия недоступна. Выберите другую.", loadOlder: "Загрузить ранние сообщения", creating: "Создаём сессию…",
        retry: "Запрос к модели повторяется.", maxTokens: "Ответ достиг лимита вывода.", interrupted: "Ответ остановлен",
        unknownError: "Операция завершилась с ошибкой.", paneLimit: "Не более 12 панелей", swapHint: "Отпустите, чтобы поменять сессии",
      },
      zh: {
        tab: "分屏", title: "分屏工作区", exitSplit: "返回聊天", addTab: "添加聊天标签", closeTab: "关闭聊天标签",
        vertical: "垂直分屏", horizontal: "水平分屏", reset: "重置布局",
        choose: "请在侧边栏选择会话", chooseHint: "当前面板已聚焦。请从左侧原生会话列表中选择要附加的对话。",
        noSession: "空面板", newWorkspace: "在工作区中新建…", session: "会话…", remove: "关闭面板",
        drag: "将此标题拖到另一个面板以交换会话", loading: "正在加载对话…", empty: "暂无消息。",
        user: "你", agent: "智能体", system: "状态", tool: "工具", image: "[图片]", reasoning: "思考",
        toolDone: "已完成", toolFailed: "失败", input: "输入", output: "输出",
        model: "模型", access: "访问", context: "上下文", contextUsed: "已使用", contextLimit: "上限", contextRemaining: "剩余", turns: "轮", steps: "步", tokensPerSecond: "词元/秒", cache: "缓存",
        permissionFailed: "无法更改访问模式。", modelFailed: "无法更改模型。", fullAccessConfirm: "启用 Full access？此模式会减少确认步骤并允许敏感操作。",
        placeholder: "给此会话发消息…", send: "发送", stop: "停止", sending: "发送中…",
        queue: "Enter 发送 · Shift+Enter 换行", queued: "消息将在当前轮次结束后排队发送",
        working: "智能体正在工作", deepDiving: "正在深入探索…", thinking: "正在思考", toolRunning: "运行中", durationSeconds: "{seconds}秒", durationMinutes: "{minutes}分{seconds}秒",
        waiting: "此会话需要在主视图中进行结构化输入", openMain: "打开主视图",
        unavailable: "会话不可用，请选择其他会话。", loadOlder: "加载更早消息", creating: "正在创建会话…",
        retry: "正在重试模型请求。", maxTokens: "回复已达到输出上限。", interrupted: "回复已停止",
        unknownError: "操作失败。", paneLimit: "最多 12 个面板", swapHint: "松开以交换会话",
      },
    };
    function isRussian() {
      return typeof navigator !== "undefined" && /^ru(?:-|$)/i.test(navigator.language || "");
    }
    function copy(localeId) {
      if (localeId && COPY[localeId]) return COPY[localeId];
      return isRussian() ? COPY.ru : COPY.en;
    }

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

    const TOOL_TITLES = Object.freeze({
      bash: "Bash", read: "Read", edit: "Edit", write: "Write", grep: "Grep", glob: "Glob",
      web_search: "Search", web_fetch: "Fetch", todo_write: "To-dos", ask_user_question: "Question",
      subagent: "Subagent", subagent_fork: "Subagent",
    });

    function displayToolTitle(name) {
      if (!name || name.startsWith("/")) return name || "Tool";
      return TOOL_TITLES[name] || name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
        return { role: "assistant", label: activeCopy.agent, reasoningLabel: activeCopy.reasoning, imageLabel: activeCopy.image, text: text || activeCopy.interrupted, blocks: node.blocks, ...(node.interrupted ? { interrupted: true, interruptedLabel: activeCopy.interrupted } : {}), key: `assistant-${node.seq}` };
      }
      if (node.kind === "context") {
        const text = textOfContent(node.content, activeCopy.image);
        return text ? { role: "system", label: activeCopy.system, text: truncate(text), key: `context-${node.seq}` } : null;
      }
      if (node.kind === "tool-result") {
        const name = node.call && node.call.name ? node.call.name : node.callId || activeCopy.tool;
        const body = textOfContent(node.content, activeCopy.image);
        return { role: node.isError ? "error" : "tool", label: activeCopy.tool, text: `${node.isError ? "✕" : "✓"} ${name}${body ? `\n${truncate(body, 320)}` : ""}`, tool: node, key: `tool-${node.seq}` };
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

    function observableSubscribe(observable, notify) {
      return observable ? observable.subscribe(notify) : () => {};
    }

    function observableSnapshot(observable, fallback) {
      return observable ? observable.getSnapshot() : fallback;
    }

    function useObservable(observable, fallback) {
      const subscribe = React.useCallback((notify) => observableSubscribe(observable, notify), [observable]);
      const getSnapshot = React.useCallback(() => observableSnapshot(observable, fallback), [observable, fallback]);
      return React.useSyncExternalStore(subscribe, getSnapshot, () => fallback);
    }

    function useSessionSnapshot(sessions, sessionId) {
      const binding = sessionId ? sessions.binding(sessionId) : undefined;
      const session = binding && binding.session;
      const subscribe = React.useCallback((listener) => session ? session.subscribe(listener) : () => {}, [session]);
      const getSnapshot = React.useCallback(() => session ? session.getSnapshot() : EMPTY_SESSION, [session]);
      const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
      return { session, snapshot };
    }

    function useSessionProjection(session, key) {
      const face = session && session.projections && typeof session.projections.faceOf === "function" ? session.projections.faceOf(key) : null;
      const subscribe = React.useCallback((listener) => face ? face.subscribe(listener) : () => {}, [face]);
      const getSnapshot = React.useCallback(() => face ? face.getSnapshot() : undefined, [face]);
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    }

    function resolveModelDirectory(modelDirectories, sessionId) {
      if (!modelDirectories || !sessionId || typeof modelDirectories.directoryFor !== "function") return null;
      try { return modelDirectories.directoryFor(sessionId); }
      catch { return null; }
    }

    function useModelDirectory(modelDirectories, sessionId) {
      const directory = resolveModelDirectory(modelDirectories, sessionId);
      const store = directory && directory.store;
      const subscribe = React.useCallback((listener) => store ? store.subscribe(listener) : () => {}, [store]);
      const getSnapshot = React.useCallback(() => store ? store.getSnapshot() : EMPTY_MODEL_DIRECTORY, [store]);
      const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
      React.useEffect(() => {
        if (!directory || state.status !== "idle") return;
        if (directory.store && directory.store.getSnapshot().status !== "idle") return;
        directory.load().catch(() => {});
      }, [directory, state.status]);
      return { directory, state };
    }

    function displayName(name) {
      if (typeof name !== "string" || !name) return "";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) return name;
      return name.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }

    function permissionLabel(option) {
      if (!option) return "";
      if (option.value === "danger-full-access") return "Full access";
      return displayName(option.name || option.value);
    }

    function modelChoicesOf(state) {
      const choices = [];
      for (const group of state && Array.isArray(state.groups) ? state.groups : []) {
        for (const model of Array.isArray(group.models) ? group.models : []) {
          choices.push({
            key: `${group.id}\u0000${model.id}`,
            provider: group.id,
            model: model.id,
            label: model.name || model.id,
            group: group.name || displayName(group.id),
            reasoningEffort: model.reasoning && model.reasoning.defaultEffort,
          });
        }
      }
      return choices;
    }

    function formatTokens(value) {
      const number = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
      const scaled = (amount) => amount >= 100 ? String(Math.round(amount)) : String(Math.round(amount * 10) / 10);
      if (number < 1000) return String(Math.round(number));
      if (number < 1000000) return `${scaled(number / 1000)}K`;
      return `${scaled(number / 1000000)}M`;
    }

    function formatTokensPerSecond(value) {
      const number = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
      return number >= 10 ? String(Math.round(number)) : String(Math.round(number * 10) / 10);
    }

    function contextOccupancy(pressure) {
      if (!pressure || !pressure.contextWindow) return null;
      const usedTokens = pressure.projectedTokens ?? pressure.pressureTokens;
      if (typeof usedTokens !== "number") return null;
      return { usedTokens, contextWindow: pressure.contextWindow, percent: Math.max(0, Math.min(100, Math.round(usedTokens / pressure.contextWindow * 100))) };
    }

    function statsSegments(sessionStats, tokenUsage, contextPressure, activeCopy) {
      const segments = [];
      const context = contextOccupancy(contextPressure);
      if (context) segments.push(`${activeCopy.context} ${context.percent}% · ${formatTokens(context.usedTokens)}/${formatTokens(context.contextWindow)}`);
      if (sessionStats && (sessionStats.turns > 0 || sessionStats.steps > 0)) {
        segments.push(`${sessionStats.turns} ${activeCopy.turns} · ${sessionStats.steps} ${activeCopy.steps}`);
        if (sessionStats.decodeMs > 0 && sessionStats.decodeTokens >= 0) segments.push(`${formatTokensPerSecond(sessionStats.decodeTokens / (sessionStats.decodeMs / 1000))} ${activeCopy.tokensPerSecond}`);
      }
      if (tokenUsage) {
        const input = (tokenUsage.uncachedInputTokens || 0) + (tokenUsage.cacheReadTokens || 0) + (tokenUsage.cacheWriteTokens || 0);
        const output = tokenUsage.outputTokens || 0;
        if (input > 0 || output > 0) {
          segments.push(`${activeCopy.input} ${formatTokens(input)} · ${activeCopy.output} ${formatTokens(output)}`);
          if (input > 0 && tokenUsage.cacheReadTokens > 0) segments.push(`${activeCopy.cache} ${Math.round(tokenUsage.cacheReadTokens / input * 100)}%`);
        }
      }
      return segments;
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

    function SplitModeGlyph() {
      return h("svg", { viewBox: "0 0 18 18", fill: "none", "aria-hidden": true },
        h("rect", { x: 2.25, y: 3, width: 13.5, height: 12, rx: 2.25, stroke: "currentColor", strokeWidth: 1.35 }),
        h("path", { d: "M9 3v12", stroke: "currentColor", strokeWidth: 1.35 }),
      );
    }

    function ResetGlyph() {
      return h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true },
        h("path", { d: "M5 8V4m0 0h4M5 4l3.2 3.2a7 7 0 1 1-1.4 7.7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }),
      );
    }

    function CloseGlyph() {
      return h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true },
        h("path", { d: "m7 7 10 10M17 7 7 17", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }),
      );
    }

    function firstVisibleLine(text) {
      return String(text || "").split("\n").find((line) => line.trim())?.trim() || "";
    }

    function latestVisibleLine(text) {
      const lines = String(text || "").trimEnd().split("\n");
      return lines[lines.length - 1]?.trim() || "";
    }

    function toolPresentation(tool, running, activeCopy) {
      if (!tool || typeof tool !== "object") return null;
      const settled = tool.kind === "tool-result";
      const call = settled ? tool.call : tool;
      const name = call && call.name ? call.name : tool.name || tool.callId || activeCopy.tool;
      const input = call && typeof call.argsRaw === "string" ? truncate(call.argsRaw, 1800) : "";
      const output = settled ? truncate(textOfContent(tool.content, activeCopy.image), 1800) : "";
      const failed = settled && Boolean(tool.isError);
      const status = running ? activeCopy.toolRunning : failed ? activeCopy.toolFailed : activeCopy.toolDone;
      const callTitle = tool.callView && tool.callView.title;
      const resultTitle = tool.resultView && tool.resultView.title;
      const presentationSummary = resultTitle || callTitle || "";
      const summary = failed
        ? tool.error && (tool.error.message || tool.error.code || tool.error.name) || status
        : presentationSummary && presentationSummary !== displayToolTitle(name)
          ? presentationSummary
          : firstVisibleLine(output) || firstVisibleLine(input) || status;
      const inputDetail = input && input !== summary ? input : "";
      const outputDetail = output && output !== summary ? output : "";
      return {
        title: displayToolTitle(name),
        summary,
        input: inputDetail,
        output: outputDetail,
        failed,
        running,
        children: Array.isArray(tool.subCalls) ? tool.subCalls : [],
      };
    }

    function ToolMessage({ row, running = false, activeCopy }) {
      const copy = activeCopy || COPY.en;
      const presentation = row.tool ? toolPresentation(row.tool, running, copy) : null;
      const [rawTitle, ...bodyLines] = row.text.split("\n");
      const fallbackText = bodyLines.join("\n").trim();
      const title = presentation ? presentation.title : displayToolTitle(rawTitle.replace(/^[✓✕…]\s*/, ""));
      const summary = presentation ? presentation.summary : firstVisibleLine(fallbackText) || (running ? row.runningLabel || copy.toolRunning : row.role === "error" ? copy.toolFailed : copy.toolDone);
      const failed = presentation ? presentation.failed : row.role === "error";
      const children = presentation ? presentation.children : [];
      const fallbackBody = !presentation && fallbackText.includes("\n") ? fallbackText : "";
      const expandable = Boolean(fallbackBody || presentation && (presentation.input || presentation.output));
      const [open, setOpen] = React.useState(false);
      const details = [];
      if (fallbackBody) details.push(h("pre", { className: "dsh-split-disclosure-body", "data-error": failed || undefined, key: "body" }, fallbackBody));
      if (presentation && (presentation.input || presentation.output)) details.push(h("div", { className: "dsh-split-tool-body", key: "details" },
        presentation.input ? h("div", { className: "dsh-split-tool-section" }, h("span", { className: "dsh-split-tool-section-label" }, copy.input), h("pre", { className: "dsh-split-tool-section-text" }, presentation.input)) : null,
        presentation.output ? h("div", { className: "dsh-split-tool-section" }, h("span", { className: "dsh-split-tool-section-label" }, copy.output), h("pre", { className: "dsh-split-tool-section-text", "data-error": failed || undefined }, presentation.output)) : null,
      ));
      const childTree = children.length ? h("div", { className: "dsh-split-tool-children" }, children.map((child) => h(ToolMessage, {
        row: { role: child.kind === "tool-result" && child.isError ? "error" : "tool", text: child.callId || child.name || copy.tool, tool: child },
        running: child.kind !== "tool-result",
        activeCopy: copy,
        key: child.callId,
      }))) : null;
      return h("div", { className: "dsh-split-tool", "data-state": running ? "running" : failed ? "error" : "ok", "data-chat-call-id": row.tool && row.tool.callId }, h(DisclosureRow, {
        className: "dsh-split-disclosure",
        rowClassName: "dsh-split-disclosure-row",
        leadingClassName: "dsh-split-disclosure-leading",
        chevronClassName: "dsh-split-disclosure-chevron",
        titleClassName: "dsh-split-disclosure-title",
        icon: failed ? h(StateDot, { state: "error" }) : h(IconApiOutline14, { size: 14 }),
        title,
        open: open && expandable,
        expandable,
        expandOnRowClick: true,
        keepContentWhenOpen: true,
        onToggle: () => setOpen((value) => !value),
        collapsedContent: h(React.Fragment, null,
          h("span", { className: "dsh-split-disclosure-separator", "aria-hidden": true }),
          h("span", { className: "dsh-split-disclosure-summary", "data-error": failed || undefined }, summary),
        ),
      }, expandable ? h(React.Fragment, null, details) : null), childTree);
    }

    function ReasoningMessage({ text, running, label }) {
      const [open, setOpen] = React.useState(false);
      const summary = running ? latestVisibleLine(text) : firstVisibleLine(text);
      return h("div", { className: "dsh-split-reasoning", "data-state": running ? "running" : "ok" }, h(DisclosureRow, {
        className: "dsh-split-disclosure",
        rowClassName: "dsh-split-disclosure-row",
        leadingClassName: "dsh-split-disclosure-leading",
        chevronClassName: "dsh-split-disclosure-chevron",
        titleClassName: "dsh-split-disclosure-title",
        icon: h(IconThinkOutline14, { size: 14 }),
        title: label || "Think",
        open,
        expandable: true,
        expandOnRowClick: true,
        onToggle: () => setOpen((value) => !value),
        collapsedContent: h(React.Fragment, null,
          h("span", { className: "dsh-split-disclosure-separator", "aria-hidden": true }),
          h("span", { className: "dsh-split-disclosure-summary", "data-follow-end": running || undefined }, summary),
        ),
      }, h("div", { className: "dsh-split-reasoning-body" }, text)));
    }

    function StoppedBadge({ row }) {
      return h("span", { className: "dsh-split-message-stopped" }, row.interruptedLabel || "Stopped");
    }

    function AssistantMessage({ row, streaming }) {
      if (!Array.isArray(row.blocks)) return row.interrupted ? h(StoppedBadge, { row }) : h(MarkdownText, { text: row.text, streaming });
      const visible = row.blocks.filter((block) => block && (block.kind === "text" || block.kind === "reasoning" || block.kind === "image"));
      if (visible.length === 0) return row.interrupted ? h(StoppedBadge, { row }) : h(MarkdownText, { text: row.text, streaming });
      const rendered = visible.map((block, index) => {
        if (block.kind === "reasoning") return h(ReasoningMessage, { text: block.text || "", running: streaming && index === visible.length - 1, label: row.reasoningLabel, key: `reasoning-${index}` });
        if (block.kind === "image") return h("span", { className: "dsh-split-image-label", key: `image-${index}` }, row.imageLabel || "[Image]");
        return h(MarkdownText, { text: block.text || "", streaming: streaming && index === visible.length - 1, key: `text-${index}` });
      });
      if (row.interrupted) rendered.push(h(StoppedBadge, { row, key: "stopped" }));
      return h("div", { className: "dsh-split-assistant-blocks" }, rendered);
    }

    function MessageRow({ row, streaming = false, activeCopy }) {
      if (row.tool || row.role === "tool" || (row.key && (row.key.startsWith("tool-") || row.key.startsWith("command-") || row.key.startsWith("running-tool-")))) return h(ToolMessage, { row, running: streaming, activeCopy });
      if (row.role === "user") return h("div", { className: "dsh-split-message", "data-role": row.role }, h(MessageText, { text: row.text }));
      if (row.role === "assistant") return h("div", { className: `dsh-split-message${streaming ? " dsh-split-stream" : ""}`, "data-role": row.role }, h(AssistantMessage, { row, streaming }));
      return h("div", { className: "dsh-split-message", "data-role": row.role }, row.text);
    }

    function runningTurnStartTime(snapshot) {
      let latest = null;
      const turns = snapshot && snapshot.chat && snapshot.chat.timeline && snapshot.chat.timeline.turns;
      if (turns && typeof turns.values === "function") {
        for (const turn of turns.values()) {
          const startTime = turn && turn.start && turn.start.time;
          if (!turn || turn.status !== "open" || !Number.isFinite(startTime)) continue;
          if (latest === null || startTime > latest) latest = startTime;
        }
        if (latest !== null) return latest;
      }
      const timings = snapshot && snapshot.turnTimings;
      if (!timings || typeof timings.values !== "function") return latest;
      for (const timing of timings.values()) {
        if (!timing || timing.endTime !== undefined || !Number.isFinite(timing.startTime)) continue;
        if (latest === null || timing.startTime > latest) latest = timing.startTime;
      }
      return latest;
    }

    function formatRunDuration(elapsedMs, activeCopy = COPY.en) {
      const total = Math.max(0, Math.floor(elapsedMs / 1000));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      const template = minutes > 0 ? activeCopy.durationMinutes : activeCopy.durationSeconds;
      return template
        .replace("{minutes}", String(minutes))
        .replace("{seconds}", minutes > 0 ? String(seconds).padStart(2, "0") : String(seconds));
    }

    function TurnStatus({ startTime, activeCopy }) {
      const [mountedAt] = React.useState(() => Date.now());
      const anchor = startTime || mountedAt;
      const [elapsedMs, setElapsedMs] = React.useState(() => Math.max(0, Date.now() - anchor));
      React.useEffect(() => {
        const tick = () => setElapsedMs(Math.max(0, Date.now() - anchor));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
      }, [anchor]);
      return h("div", { className: "dsh-split-turn-status", role: "status", "aria-live": "polite" },
        activeCopy.deepDiving,
        elapsedMs >= 15000 ? h("span", { className: "dsh-split-turn-status-clock", "aria-hidden": true }, formatRunDuration(elapsedMs, activeCopy)) : null,
      );
    }

    function chatNodeItems(raw) {
      if (!raw || typeof raw !== "object" || raw.visibility === "hidden") return [];
      const key = raw.key || `${raw.kind}:${raw.anchorSeq || 0}`;
      if (raw.kind === "assistant-step") {
        const data = raw.data || {};
        if (data.status === "running" || data.status === "interrupted") return [{
          kind: "assistant",
          key,
          blocks: data.blocks || [],
          turn: data.turn,
          step: data.step,
          streaming: data.status === "running",
          interrupted: data.status === "interrupted",
        }];
        return data.finalNode ? [{ kind: "node", key, node: data.finalNode }] : [];
      }
      if (raw.kind === "tool-call") {
        const tool = raw.data && raw.data.root;
        return tool ? [{ kind: "tool", key, tool, running: tool.kind !== "tool-result" }] : [];
      }
      if (raw.kind === "manual-compaction") {
        const data = raw.data || {};
        return [data.command, data.compaction].filter(Boolean).map((node, index) => ({ kind: "node", key: `${key}:${index}`, node }));
      }
      if (raw.kind === "model-retry") {
        const attempts = raw.data && Array.isArray(raw.data.attempts) ? raw.data.attempts : [];
        return attempts.map((node, index) => ({ kind: "node", key: `${key}:${index}`, node }));
      }
      if (raw.kind === "turn-tail") return [];
      return raw.data ? [{ kind: "node", key, node: raw.data }] : [];
    }

    function orderedConversationItems(snapshot) {
      const chat = snapshot && snapshot.chat;
      if (chat && Array.isArray(chat.order) && chat.nodes && typeof chat.nodes.get === "function") {
        return chat.order.flatMap((key) => chatNodeItems(chat.nodes.get(key))).slice(-80);
      }
      const items = (snapshot && snapshot.nodes || []).map((node) => ({ kind: "node", key: `${node.kind}-${node.seq}`, node }));
      if (snapshot && snapshot.partial) items.push({ kind: "assistant", key: `partial:${snapshot.partial.turn}:${snapshot.partial.step}`, blocks: snapshot.partial.blocks || [], turn: snapshot.partial.turn, step: snapshot.partial.step, streaming: true, interrupted: false });
      for (const tool of snapshot && snapshot.runningCalls || []) items.push({ kind: "tool", key: `running-tool-${tool.callId}`, tool, running: true });
      return items.slice(-80);
    }

    function MessageList({ session, snapshot, activeCopy }) {
      const endRef = React.useRef(null);
      const items = orderedConversationItems(snapshot);
      React.useEffect(() => {
        if (endRef.current) endRef.current.scrollIntoView({ block: "end" });
      }, [snapshot, items.length]);

      if (snapshot.openState === "cold" || snapshot.openState === "loading") return h("div", { className: "dsh-split-transcript" }, h("div", { className: "dsh-split-empty" }, activeCopy.loading));
      if (snapshot.openState === "error") return h("div", { className: "dsh-split-transcript" }, h("div", { className: "dsh-split-empty" }, errorMessage(snapshot.openError, activeCopy.unknownError)));
      const children = [];
      let renderedCount = 0;
      if (snapshot.hasMore) children.push(h("div", { className: "dsh-split-history", key: "older" }, h("button", { type: "button", className: "dsh-split-button", disabled: snapshot.loadingOlder, onClick: () => void session.loadOlder() }, activeCopy.loadOlder)));
      for (const item of items) {
        if (item.kind === "node") {
          const projected = projectNode(item.node, activeCopy);
          if (!projected) continue;
          renderedCount += 1;
          children.push(h(MessageRow, { row: { ...projected, key: item.key }, activeCopy, key: item.key }));
          continue;
        }
        if (item.kind === "assistant") {
          const text = textOfAssistant(item.blocks, activeCopy);
          if (!text && !item.interrupted) continue;
          renderedCount += 1;
          children.push(h(MessageRow, {
            row: {
              role: "assistant",
              reasoningLabel: activeCopy.reasoning,
              imageLabel: activeCopy.image,
              text: text || activeCopy.interrupted,
              blocks: item.blocks,
              ...(item.interrupted ? { interrupted: true, interruptedLabel: activeCopy.interrupted } : {}),
              key: item.key,
            },
            streaming: item.streaming,
            activeCopy,
            key: item.key,
          }));
          continue;
        }
        const failed = item.tool.kind === "tool-result" && item.tool.isError;
        renderedCount += 1;
        children.push(h(MessageRow, {
          row: { role: failed ? "error" : "tool", text: item.tool.callId || item.tool.name || activeCopy.tool, tool: item.tool, key: item.key },
          streaming: item.running,
          activeCopy,
          key: item.key,
        }));
      }
      if (renderedCount === 0 && !snapshot.running) children.push(h("div", { className: "dsh-split-empty", key: "empty" }, activeCopy.empty));
      if (snapshot.running) children.push(h(TurnStatus, { startTime: runningTurnStartTime(snapshot), activeCopy, key: "turn-status" }));
      children.push(h("div", { ref: endRef, key: "end" }));
      return h("div", { className: "dsh-split-transcript", "aria-live": "polite" }, h("div", { className: "dsh-split-flow" }, children));
    }

    function SessionPicker({ activeCopy }) {
      return h("div", { className: "dsh-split-picker" },
        h("h3", null, activeCopy.choose),
        h("p", null, activeCopy.chooseHint),
      );
    }

    function AccessControlGlyph() {
      return h("svg", { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true },
        h("path", { d: "M8 1.8 13 3.7v3.7c0 3.2-2 5.7-5 6.8-3-1.1-5-3.6-5-6.8V3.7L8 1.8Z", stroke: "currentColor", strokeWidth: 1.25, strokeLinejoin: "round" }),
        h("path", { d: "M6.1 7.7 7.35 9 10.2 6.1", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round", strokeLinejoin: "round" }),
      );
    }

    function ModelControlGlyph() {
      return h("svg", { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true },
        h("path", { d: "M5.15 2.25h5.7l2.85 4.9L10.85 12H5.15L2.3 7.15l2.85-4.9Z", stroke: "currentColor", strokeWidth: 1.2, strokeLinejoin: "round" }),
        h("circle", { cx: 8, cy: 7.15, r: 1.75, stroke: "currentColor", strokeWidth: 1.2 }),
      );
    }

    function usePopupDismissal(open, setOpen, rootRef) {
      React.useEffect(() => {
        const root = rootRef.current;
        if (!open || !root) return undefined;
        const doc = root.ownerDocument;
        const closeOutside = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
        const closeEscape = (event) => {
          if (event.key !== "Escape") return;
          setOpen(false);
          rootRef.current?.querySelector("button")?.focus();
        };
        doc.addEventListener("pointerdown", closeOutside);
        doc.addEventListener("keydown", closeEscape);
        return () => {
          doc.removeEventListener("pointerdown", closeOutside);
          doc.removeEventListener("keydown", closeEscape);
        };
      }, [open]);
    }

    function CompactSelector({ kind, icon, value, options, label, disabled, onSelect }) {
      const [open, setOpen] = React.useState(false);
      const rootRef = React.useRef(null);
      usePopupDismissal(open, setOpen, rootRef);
      React.useEffect(() => { if (disabled && open) setOpen(false); }, [disabled, open]);
      const selected = options.find((option) => option.value === value);
      const selectedLabel = selected ? selected.label : label;
      const groups = [];
      for (const option of options) {
        const key = option.group || "";
        let group = groups.find((item) => item.key === key);
        if (!group) { group = { key, options: [] }; groups.push(group); }
        group.options.push(option);
      }
      return h("span", { className: "dsh-split-control-selector", "data-kind": kind, "data-open": open || undefined, ref: rootRef },
        h("button", {
          type: "button", className: "dsh-split-control-trigger", disabled, title: selectedLabel,
          "aria-label": `${label}: ${selectedLabel}`, "aria-haspopup": "menu", "aria-expanded": open,
          onClick: () => setOpen((current) => !current),
        },
          h("span", { className: "dsh-split-control-icon" }, icon),
          h("span", { className: "dsh-split-control-label" }, selectedLabel),
          h("svg", { className: "dsh-split-control-chevron", viewBox: "0 0 12 12", fill: "none", "aria-hidden": true }, h("path", { d: "m2.5 4.5 3.5 3 3.5-3", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" })),
        ),
        open ? h("div", { className: "dsh-split-control-menu", role: "menu", "aria-label": label },
          groups.map((group) => h("div", { className: "dsh-split-control-group", role: "group", "aria-label": group.key || label, key: group.key || "default" },
            group.key ? h("div", { className: "dsh-split-control-group-label" }, group.key) : null,
            group.options.map((option) => h("button", {
              type: "button", className: "dsh-split-control-option", role: "menuitemradio", "aria-checked": option.value === value,
              disabled: option.disabled, title: option.description || option.label, key: option.value,
              onClick: () => { setOpen(false); if (option.value !== value) void onSelect(option.value); },
            },
              h("span", { className: "dsh-split-control-option-label" }, option.label),
              h("svg", { className: "dsh-split-control-check", viewBox: "0 0 16 16", fill: "none", "aria-hidden": true }, h("path", { d: "m3.2 8.1 3.05 3.05 6.55-6.4", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" })),
            )),
          )),
        ) : null,
      );
    }

    function ContextControl({ context, activeCopy, initiallyOpen = false }) {
      const [open, setOpen] = React.useState(initiallyOpen);
      const rootRef = React.useRef(null);
      usePopupDismissal(open, setOpen, rootRef);
      const pressure = context.percent >= 95 ? "critical" : context.percent >= 80 ? "warning" : undefined;
      const remaining = Math.max(0, context.contextWindow - context.usedTokens);
      const description = `${activeCopy.context} ${context.percent}% · ${formatTokens(context.usedTokens)}/${formatTokens(context.contextWindow)}`;
      return h("span", { className: "dsh-split-context-control", "data-open": open || undefined, "data-pressure": pressure, ref: rootRef },
        h("button", {
          type: "button", className: "dsh-split-context-trigger", title: description,
          "aria-label": description, "aria-haspopup": "dialog", "aria-expanded": open,
          onClick: () => setOpen((current) => !current),
        },
          h("span", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": context.percent, "aria-label": description },
            h("svg", { className: "dsh-split-context-ring", viewBox: "0 0 14 14", "aria-hidden": true },
              h("circle", { className: "dsh-split-context-track", cx: 7, cy: 7, r: 5.5 }),
              h("circle", { className: "dsh-split-context-fill", cx: 7, cy: 7, r: 5.5, strokeDasharray: `${34.5575 * context.percent / 100} 34.5575`, transform: "rotate(-90 7 7)" }),
            ),
          ),
          h("span", { className: "dsh-split-context-label" }, `${context.percent}%`),
        ),
        open ? h("div", { className: "dsh-split-context-popover", "data-pressure": pressure, role: "dialog", "aria-label": activeCopy.context },
          h("div", { className: "dsh-split-context-popover-head" }, h("span", null, activeCopy.context), h("span", { className: "dsh-split-context-popover-percent" }, `${context.percent}%`)),
          h("div", { className: "dsh-split-context-bar", "aria-hidden": true }, h("span", { style: { width: `${context.percent}%` } })),
          h("div", { className: "dsh-split-context-rows" },
            h("span", null, activeCopy.contextUsed), h("strong", null, formatTokens(context.usedTokens)),
            h("span", null, activeCopy.contextRemaining), h("strong", null, formatTokens(remaining)),
            h("span", null, activeCopy.contextLimit), h("strong", null, formatTokens(context.contextWindow)),
          ),
        ) : null,
      );
    }

    function ComposerControls({ permissions, modelState, contextPressure, disabled, activeCopy, onPermission, onModel }) {
      const permissionOptions = permissions && Array.isArray(permissions.options) ? permissions.options : [];
      const modelChoices = modelChoicesOf(modelState);
      const modelValue = modelState && modelState.current ? `${modelState.current.provider}\u0000${modelState.current.model}` : "";
      const visibleModelChoices = modelValue && !modelChoices.some((choice) => choice.key === modelValue)
        ? [{ key: modelValue, provider: modelState.current.provider, model: modelState.current.model, label: modelState.current.model, group: displayName(modelState.current.provider) }, ...modelChoices]
        : modelChoices;
      const context = contextOccupancy(contextPressure);
      return h("div", { className: "dsh-split-compose-controls" },
        permissionOptions.length ? h(CompactSelector, {
          kind: "permission", icon: h(AccessControlGlyph), value: permissions.currentValue || "", label: activeCopy.access, disabled,
          options: permissionOptions.map((option) => ({ value: option.value, label: permissionLabel(option), description: option.description || "", disabled: option.value === "custom" })),
          onSelect: onPermission,
        }) : null,
        modelState && modelState !== EMPTY_MODEL_DIRECTORY ? h(CompactSelector, {
          kind: "model", icon: h(ModelControlGlyph), value: modelValue, label: activeCopy.model,
          disabled: disabled || modelState.status === "loading" || modelState.status === "selecting" || modelChoices.length === 0,
          options: visibleModelChoices.map((choice) => ({ value: choice.key, label: choice.label, group: choice.group })),
          onSelect: onModel,
        }) : null,
        context ? h(ContextControl, { context, activeCopy }) : null,
      );
    }

    function StatsLine({ segments }) {
      if (!segments.length) return null;
      return h("div", { className: "dsh-split-stats", "aria-label": segments.join(" · ") }, segments.map((segment, index) => h("span", { className: "dsh-split-stat", key: `${index}:${segment}` }, segment)));
    }

    function PaneTabs({ node, list, activeState, activeCopy, onSelect, onClose, onAdd }) {
      const [pickerOpen, setPickerOpen] = React.useState(false);
      const tabs = normalizePaneTabs(node.tabs, node.sessionId);
      const candidates = (list.ids || []).map((id) => list.byId[id]).filter((row) => row && row.id && !tabs.includes(row.id) && row.origin !== "subagent" && !row.parentId);
      return h(React.Fragment, null,
        h("div", { className: "dsh-split-tabs", role: "tablist", "aria-label": activeCopy.title },
          tabs.map((sessionId) => {
            const summary = list.byId[sessionId];
            const selected = sessionId === node.sessionId;
            const state = selected ? activeState : statusOf(summary, EMPTY_SESSION);
            return h("div", { className: "dsh-split-tab", "data-active": selected || undefined, role: "presentation", key: sessionId },
              h("button", {
                type: "button", className: "dsh-split-tab-main", role: "tab", "aria-selected": selected, tabIndex: selected ? 0 : -1, title: summary ? summary.displayTitle || summary.title || sessionId : sessionId,
                onPointerDown: (event) => event.stopPropagation(), onDragStart: (event) => event.preventDefault(), onClick: () => onSelect(sessionId),
                onKeyDown: (event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  const index = tabs.indexOf(sessionId);
                  const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index <= 0 ? tabs.length : index) - 1;
                  onSelect(tabs[next]);
                },
              }, h("span", { className: "dsh-split-status-dot", "data-state": state }), h("span", { className: "dsh-split-tab-label" }, summary ? summary.displayTitle || summary.title || sessionId : sessionId)),
              h("button", {
                type: "button", className: "dsh-split-tab-close", title: activeCopy.closeTab, "aria-label": activeCopy.closeTab,
                onPointerDown: (event) => event.stopPropagation(), onDragStart: (event) => event.preventDefault(), onClick: (event) => { event.stopPropagation(); onClose(sessionId); },
              }, "×"),
            );
          }),
          h("button", {
            type: "button", className: "dsh-split-tab-add", title: activeCopy.addTab, "aria-label": activeCopy.addTab,
            onPointerDown: (event) => event.stopPropagation(), onDragStart: (event) => event.preventDefault(), onClick: (event) => { event.stopPropagation(); setPickerOpen((value) => !value); },
          }, "+"),
        ),
        pickerOpen ? h("div", { className: "dsh-split-tab-picker", role: "menu", "aria-label": activeCopy.addTab },
          candidates.length ? candidates.map((summary) => h("button", {
            type: "button", className: "dsh-split-tab-option", role: "menuitem", key: summary.id,
            onPointerDown: (event) => event.stopPropagation(), onClick: () => { setPickerOpen(false); onAdd(summary.id); },
          }, h("span", { className: "dsh-split-status-dot", "data-state": statusOf(summary, EMPTY_SESSION) }), h("span", { className: "dsh-split-tab-option-label" }, summary.displayTitle || summary.title || summary.id)))
            : h("span", { className: "dsh-split-tab-option", "aria-disabled": true }, activeCopy.empty),
        ) : null,
      );
    }

    function PaneView(props) {
      const { node, list, workspaces, sessions, modelDirectories, active, paneCount, onActive, onSplit, onRemove, onReset, onSwap, onOpenMain, onTabSelect, onTabClose, onTabAdd, activeCopy } = props;
      const summary = node.sessionId ? list.byId[node.sessionId] : undefined;
      const available = Boolean(summary);
      const sessionId = available ? node.sessionId : null;
      const { session, snapshot } = useSessionSnapshot(sessions, sessionId);
      const permissions = useSessionProjection(session, "permissions");
      const contextPressure = useSessionProjection(session, "contextPressure");
      const sessionStats = useSessionProjection(session, "sessionStats");
      const tokenUsage = useSessionProjection(session, "tokenUsage");
      const { directory: modelDirectory, state: modelState } = useModelDirectory(modelDirectories, sessionId);
      const draftKey = `${node.id}:${node.sessionId || "empty"}`;
      const inputRef = React.useRef(null);
      const [draft, setDraft] = React.useState(() => loadDraft(draftKey));
      const [sending, setSending] = React.useState(false);
      const [controlsBusy, setControlsBusy] = React.useState(null);
      const [error, setError] = React.useState("");
      const [drop, setDrop] = React.useState(false);
      const state = statusOf(summary, snapshot);
      const workspace = sessionWorkspace(summary, workspaces);
      const waiting = state === "waiting";
      const canSend = Boolean(session && snapshot.openState === "open" && !snapshot.removed && draft.trim() && !sending);
      const stats = statsSegments(sessionStats, tokenUsage, contextPressure, activeCopy);
      const visibleError = error || (modelDirectory && modelState.error) || "";

      React.useEffect(() => saveDraft(draftKey, draft), [draftKey, draft]);
      React.useLayoutEffect(() => { restoreComposerFocus(draftKey, inputRef.current); });

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

      const changePermission = async (value) => {
        if (!session || controlsBusy || !permissions || !permissions.options.some((option) => option.value === value && value !== "custom")) return;
        if (value === "danger-full-access" && (typeof window.confirm !== "function" || !window.confirm(activeCopy.fullAccessConfirm))) return;
        setControlsBusy("permission");
        setError("");
        try {
          const result = await session.command(`/permission ${value}`);
          if (!result.ok) throw result.error;
          if (!result.value || !result.value.matched) throw new Error(activeCopy.permissionFailed);
        } catch (cause) {
          setError(errorMessage(cause, activeCopy.permissionFailed));
        } finally {
          setControlsBusy((current) => current === "permission" ? null : current);
        }
      };

      const changeModel = async (key) => {
        if (!modelDirectory || controlsBusy) return;
        const choice = modelChoicesOf(modelState).find((item) => item.key === key);
        if (!choice) return;
        setControlsBusy("model");
        setError("");
        try {
          await modelDirectory.select({ provider: choice.provider, model: choice.model, ...(choice.reasoningEffort === undefined ? {} : { reasoningEffort: choice.reasoningEffort }) });
        } catch (cause) {
          setError(errorMessage(cause, activeCopy.modelFailed));
        } finally {
          setControlsBusy((current) => current === "model" ? null : current);
        }
      };

      const header = h("header", {
        className: "dsh-split-pane-header", draggable: true, title: activeCopy.drag,
        onDragStart: (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-dsh-split-pane", node.id); },
        onDragOver: (event) => { if (event.dataTransfer.types.includes("application/x-dsh-split-pane")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDrop(true); } },
        onDragLeave: () => setDrop(false),
        onDrop: (event) => { event.preventDefault(); setDrop(false); onSwap(event.dataTransfer.getData("application/x-dsh-split-pane"), node.id); },
        onDragEnd: () => setDrop(false),
      },
        h(PaneTabs, {
          node, list, activeState: state, activeCopy,
          onSelect: (sessionId) => onTabSelect(node.id, sessionId),
          onClose: (sessionId) => onTabClose(node.id, sessionId),
          onAdd: (sessionId) => onTabAdd(node.id, sessionId),
        }),
        workspace ? h("span", { className: "dsh-split-workspace", title: summary && summary.cwd }, workspace) : null,
        h("span", { className: "dsh-split-header-actions" },
          active ? h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.reset, "aria-label": activeCopy.reset, onClick: (event) => { event.stopPropagation(); onReset(); } }, h(ResetGlyph)) : null,
          h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.vertical, "aria-label": activeCopy.vertical, onClick: (event) => { event.stopPropagation(); onSplit(node.id, "row"); } }, h(LayoutGlyph, { direction: "row", size: 15 })),
          h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.horizontal, "aria-label": activeCopy.horizontal, onClick: (event) => { event.stopPropagation(); onSplit(node.id, "column"); } }, h(LayoutGlyph, { direction: "column", size: 15 })),
          h("button", { type: "button", className: "dsh-split-header-action", title: activeCopy.remove, "aria-label": activeCopy.remove, disabled: paneCount <= 1, onClick: (event) => { event.stopPropagation(); onRemove(node.id); } }, h(CloseGlyph)),
        ),
      );

      let content;
      if (!node.sessionId) content = h(SessionPicker, { activeCopy });
      else if (!available || !session) content = h(SessionPicker, { activeCopy });
      else content = h(React.Fragment, null,
        waiting ? h("div", { className: "dsh-split-banner" }, activeCopy.waiting, h("button", { type: "button", onClick: () => onOpenMain(node.sessionId) }, activeCopy.openMain)) : null,
        h(MessageList, { session, snapshot, activeCopy }),
        h("form", { className: "dsh-split-compose", onSubmit: (event) => { event.preventDefault(); void send(); } },
          h("div", { className: "dsh-split-compose-card" },
            h("textarea", {
              ref: inputRef,
              rows: 1,
              value: draft,
              disabled: snapshot.removed || snapshot.openState !== "open",
              placeholder: activeCopy.placeholder,
              "aria-label": activeCopy.placeholder,
              onFocus: (event) => rememberComposerFocus(draftKey, event.currentTarget),
              onSelect: (event) => rememberComposerFocus(draftKey, event.currentTarget),
              onBlur: () => releaseComposerFocus(draftKey),
              onChange: (event) => { rememberComposerFocus(draftKey, event.currentTarget); setDraft(event.currentTarget.value); },
              onKeyDown: (event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } },
            }),
            h("div", { className: "dsh-split-compose-footer" },
              h(ComposerControls, {
                permissions,
                modelState: modelDirectory ? modelState : null,
                contextPressure,
                disabled: Boolean(controlsBusy || !session || snapshot.removed),
                activeCopy,
                onPermission: changePermission,
                onModel: changeModel,
              }),
              h("button", {
                type: snapshot.running ? "button" : "submit",
                className: "dsh-split-send",
                "data-stop": snapshot.running || undefined,
                disabled: snapshot.running ? !session : !canSend,
                title: snapshot.running ? activeCopy.stop : activeCopy.send,
                "aria-label": snapshot.running ? activeCopy.stop : activeCopy.send,
                onClick: snapshot.running ? () => void cancel() : undefined,
              }, h(ArrowGlyph)),
            ),
            h("div", { className: "dsh-split-compose-meta", "data-error": Boolean(visibleError) || undefined }, visibleError || (sending ? activeCopy.sending : snapshot.running ? activeCopy.queued : activeCopy.queue)),
          ),
          h(StatsLine, { segments: stats }),
        ),
      );

      return h("section", { className: "dsh-split-pane", "data-active": active, "data-drop": drop || undefined, onPointerDown: () => onActive(node.id) },
        header,
        h("div", { className: "dsh-split-pane-body", "data-picker": !(node.sessionId && available && session) || undefined, "data-waiting": waiting || undefined }, content),
      );
    }

    function sameSessionIds(first, second) {
      const a = first || [];
      const b = second || [];
      return a === b || (a.length === b.length && a.every((value, index) => value === b[index]));
    }

    function equalPaneProps(previous, next) {
      if (
        previous.node !== next.node ||
        previous.active !== next.active ||
        previous.paneCount !== next.paneCount ||
        previous.workspaces !== next.workspaces ||
        previous.sessions !== next.sessions ||
        previous.modelDirectories !== next.modelDirectories ||
        previous.activeCopy !== next.activeCopy ||
        !sameSessionIds(previous.list.ids, next.list.ids)
      ) return false;
      for (const sessionId of normalizePaneTabs(next.node.tabs, next.node.sessionId)) {
        if (previous.list.byId[sessionId] !== next.list.byId[sessionId]) return false;
      }
      return true;
    }

    const StablePaneView = typeof React.memo === "function" ? React.memo(PaneView, equalPaneProps) : PaneView;

    function SplitNode({ node, activePane, onRatio, ...paneProps }) {
      const containerRef = React.useRef(null);
      const [dragging, setDragging] = React.useState(false);
      if (node.type === "pane") return h(StablePaneView, { key: `${node.id}:${node.sessionId || "empty"}`, node, ...paneProps, active: node.id === activePane });
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

    function SplitSidebarAction({ wide, controller, locale }) {
      const localeSnapshot = useObservable(locale, EMPTY_LOCALE);
      const activeCopy = copy(localeSnapshot.active);
      const active = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
      return h("button", {
        type: "button",
        className: "dsh-split-sidebar-toggle",
        "data-wide": wide || undefined,
        "data-active": active || undefined,
        title: activeCopy.title,
        "aria-label": activeCopy.title,
        "aria-pressed": active,
        onClick: controller.toggle,
      }, h(SplitModeGlyph), wide ? h("span", { className: "dsh-split-sidebar-label" }, activeCopy.tab) : null);
    }

    function SplitScreenEntry({ sessions, workspaces, modelDirectories, locale, sessionId, onExit }) {
      const localeSnapshot = useObservable(locale, EMPTY_LOCALE);
      const activeCopy = copy(localeSnapshot.active);
      const list = useObservable(sessions.list, EMPTY_LIST);
      const workspaceList = useObservable(workspaces.list, EMPTY_WORKSPACES);
      const selectedSessionId = sessionId || list.current || null;
      const fallback = selectedSessionId || (list.ids || []).find((id) => list.byId[id] && !list.byId[id].blank) || null;
      const [layout, setLayout] = React.useState(() => loadLayout(fallback));
      const [activePane, setActivePaneState] = React.useState(() => loadActivePane(layout));
      const [notice, setNotice] = React.useState("");
      const autoSeeded = React.useRef(false);
      const observedSession = React.useRef(null);
      const mounted = React.useRef(true);
      const activatePane = React.useCallback((paneId) => {
        if (!paneId) return;
        saveActivePane(paneId);
        setActivePaneState(paneId);
      }, []);
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
        setLayout((current) => setPaneSession(current, paneIds(current)[0], fallback));
      }, [fallback, layout]);
      React.useEffect(() => {
        if (paneIds(layout).includes(activePane)) return;
        activatePane(paneIds(layout)[0]);
      }, [layout, activePane, activatePane]);

      const assign = React.useCallback((paneId, targetSessionId) => {
        const snapshot = sessions.list.getSnapshot();
        if (!targetSessionId || !snapshot.byId[targetSessionId]) return;
        openWithoutNativeSelection(sessions, targetSessionId);
        const destination = paneForSession(layout, targetSessionId) || paneId || paneIds(layout)[0];
        if (!destination) return;
        if (mounted.current) {
          setLayout((current) => setPaneSession(current, destination, targetSessionId));
          activatePane(destination);
        } else {
          publishLayout(setPaneSession(loadLayout(selectedSessionId || null), destination, targetSessionId));
        }
      }, [sessions, selectedSessionId, activatePane, layout]);

      React.useEffect(() => {
        if (!selectedSessionId || observedSession.current === selectedSessionId) return;
        observedSession.current = selectedSessionId;
        assign(activePane, selectedSessionId);
      }, [selectedSessionId, activePane, assign]);

      const split = React.useCallback((paneId, direction) => {
        setNotice("");
        setLayout((current) => {
          if (countPanes(current) >= MAX_PANES) { setNotice(activeCopy.paneLimit); return current; }
          const nextPane = pane();
          activatePane(nextPane.id);
          return splitPane(current, paneId, direction, nextPane);
        });
      }, [activeCopy.paneLimit, activatePane]);

      const remove = React.useCallback((paneId) => {
        setLayout((current) => countPanes(current) <= 1 ? current : removePane(current, paneId) || pane());
      }, []);

      React.useEffect(() => {
        for (const id of sessionIds(layout)) {
          if (sessions.list.getSnapshot().byId[id]) openWithoutNativeSelection(sessions, id);
        }
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
        const current = sessionForPane(layout, activePane) || sessions.list.getSnapshot().current || fallback;
        const next = pane(current || null);
        setLayout(next);
        activatePane(next.id);
        setNotice("");
      };

      const openMain = (targetSessionId) => {
        try { sessions.open(targetSessionId); }
        finally { onExit(); }
      };

      const exitWorkspace = () => {
        const targetSessionId = sessionForPane(layout, activePane);
        try { if (targetSessionId) sessions.open(targetSessionId); }
        finally { onExit(); }
      };

      const paneProps = {
        list,
        workspaces: workspaceList,
        sessions,
        modelDirectories,
        active: false,
        paneCount: count,
        onActive: activatePane,
        onSplit: split,
        onRemove: remove,
        onReset: reset,
        onSwap: (source, target) => setLayout((current) => swapPaneSessions(current, source, target)),
        onOpenMain: openMain,
        onTabSelect: assign,
        onTabAdd: assign,
        onTabClose: (paneId, targetSessionId) => { setLayout((current) => closePaneSession(current, paneId, targetSessionId)); activatePane(paneId); },
        activeCopy,
      };

      return h("div", { className: "dsh-split-workspace-view", "aria-label": activeCopy.title },
        notice ? h("span", { className: "dsh-split-visually-hidden", role: "status" }, notice) : null,
        h("header", { className: "dsh-split-workspace-toolbar" },
          h("span", { className: "dsh-split-workspace-mark", "aria-hidden": true }),
          h("strong", { className: "dsh-split-workspace-title" }, activeCopy.title),
          h("button", { type: "button", className: "dsh-split-workspace-exit", onClick: exitWorkspace }, activeCopy.exitSplit),
        ),
        h("main", { className: "dsh-split-canvas" }, h(SplitNode, {
          node: layout,
          activePane,
          onRatio: (id, ratio) => setLayout((current) => setSplitRatio(current, id, ratio)),
          ...paneProps,
        })),
      );
    }

    const inject = ["slots", "sessions", "workspaces", "modelDirectories", "locale"];
    function apply(ctx) {
      let active = loadCenterMode();
      let centerDeclared = false;
      let disposeCenter = null;
      const listeners = new Set();
      const notify = () => { for (const listener of listeners) listener(); };
      const mountCenter = () => {
        if (!centerDeclared || !active || disposeCenter) return;
        try {
          disposeCenter = ctx.slots.register(
            { name: "conversation", priority: -100 },
            (props) => h(SplitScreenEntry, {
              ...props,
              sessions: ctx.sessions,
              workspaces: ctx.workspaces,
              modelDirectories: ctx.modelDirectories,
              locale: ctx.locale,
              onExit: () => controller.set(false),
            }),
          );
        } catch (error) {
          active = false;
          saveCenterMode(false);
          console.error("dsh split-screen: could not mount center workspace", error);
        }
      };
      const unmountCenter = () => {
        if (!disposeCenter) return;
        const dispose = disposeCenter;
        disposeCenter = null;
        dispose();
      };
      const controller = {
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        getSnapshot() { return active; },
        set(next) {
          const value = Boolean(next);
          if (value === active) return;
          active = value;
          saveCenterMode(active);
          if (active) mountCenter(); else unmountCenter();
          notify();
        },
        toggle() { controller.set(!active); },
      };

      ctx.effect(
        () => ctx.slots.inject("conversation", () => {
          centerDeclared = true;
          mountCenter();
          return () => { centerDeclared = false; unmountCenter(); };
        }),
        "split-screen: center workspace",
      );
      ctx.effect(
        () => ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register(
          { name: "sidebar.footer.action", id: "split-screen", order: 50, label: () => copy(ctx.locale.getLocale().active).tab },
          (props) => h(SplitSidebarAction, { ...props, controller, locale: ctx.locale }),
        )),
        "split-screen: sidebar toggle",
      );
      ctx.effect(() => () => { unmountCenter(); listeners.clear(); }, "split-screen: cleanup");
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.__testing = { pane, normalizePaneTabs, countPanes, paneIds, sessionIds, splitPane, removePane, setSplitRatio, swapPaneSessions, setPaneSession, closePaneSession, paneForSession, sessionForPane, sanitizeLayout, sameSessionIds, equalPaneProps, rememberComposerFocus, releaseComposerFocus, restoreComposerFocus, projectNode, textOfContent, textOfAssistant, observableSubscribe, observableSnapshot, loadActivePane, saveActivePane, loadDraft, saveDraft, formatRunDuration, displayToolTitle, toolPresentation, orderedConversationItems, modelChoicesOf, permissionLabel, contextOccupancy, statsSegments, CompactSelector, ContextControl, ComposerControls, PaneTabs, MessageList, PaneView, SplitScreenEntry, copy };
    return module.exports;
  },
});
