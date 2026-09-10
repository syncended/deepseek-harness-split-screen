import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadClient({ useSyncExternalStore, primitiveOverrides = {} } = {}) {
  let definition;
  const styles = [];
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
  };
  const document = {
    head: { appendChild: (node) => styles.push(node) },
    querySelector: () => null,
    createElement: (name) => ({ name, dataset: {}, textContent: "" }),
  };
  const context = vm.createContext({
    window: { __ModuleLoader__: { load: (value) => { definition = value; } } },
    document,
    localStorage,
    navigator: { language: "en" },
    console,
  });
  const source = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  vm.runInContext(source, context, { filename: "lib/client.js" });
  assert.equal(definition.id, "@syncended/dsh-split-screen");
  const React = {
    Fragment: Symbol("Fragment"),
    createElement(type, props, ...children) {
      assert.ok(type, "React element type must not be undefined or null");
      return {
        type,
        props: {
          ...(props || {}),
          children: children.length === 0 ? null : children.length === 1 ? children[0] : children,
        },
      };
    },
    memo: (component) => component,
    useCallback: (fn) => fn,
    useEffect() {},
    useLayoutEffect() {},
    useRef: () => ({ current: null }),
    useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    useSyncExternalStore: useSyncExternalStore || ((_subscribe, getSnapshot) => getSnapshot()),
  };
  const primitive = (name) => function Primitive(props) {
    if (name === "MarkdownText") {
      assert.equal(typeof props.labels.code.copyLabel, "string");
      assert.equal(typeof props.labels.code.copiedLabel, "string");
      assert.equal(typeof props.labels.footnotes, "string");
    }
    return React.createElement(name, props, props.children);
  };
  const client = definition.factory((id) => {
    if (id === "react") return React;
    if (id === "@deepseek-ai/dsh-client-ui-primitives") return {
      DisclosureRow: primitive("DisclosureRow"),
      IconApiOutline14: primitive("IconApiOutline14"),
      IconThinkOutline14: primitive("IconThinkOutline14"),
      MarkdownText: primitive("MarkdownText"),
      MessageText: primitive("MessageText"),
      StateDot: primitive("StateDot"),
      ...primitiveOverrides,
    };
    throw new Error(`Unexpected require: ${id}`);
  });
  return { client, styles, storage };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function render(node) {
  if (node == null || node === false || node === true) return null;
  if (Array.isArray(node)) return node.flatMap((child) => {
    const rendered = render(child);
    if (rendered == null) return [];
    return Array.isArray(rendered) ? rendered : [rendered];
  });
  if (typeof node !== "object") return node;
  if (typeof node.type === "function") return render(node.type(node.props || {}));
  if (typeof node.type === "symbol") return render(node.props && node.props.children);
  const { children, ...props } = node.props || {};
  return { type: node.type, props, children: render(children) };
}

function findAll(node, predicate, result = []) {
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, predicate, result);
    return result;
  }
  if (!node || typeof node !== "object") return result;
  if (predicate(node)) result.push(node);
  findAll(node.children, predicate, result);
  return result;
}

function findRaw(node, predicate, result = []) {
  if (Array.isArray(node)) {
    for (const child of node) findRaw(child, predicate, result);
    return result;
  }
  if (!node || typeof node !== "object") return result;
  if (predicate(node)) result.push(node);
  findRaw(node.props && node.props.children, predicate, result);
  return result;
}

function byClass(tree, className) {
  return findAll(tree, (node) => String(node.props && node.props.className || "").split(/\s+/).includes(className));
}

function byType(tree, type) {
  return findAll(tree, (node) => node.type === type);
}

function openSnapshot(overrides = {}) {
  return {
    sessionId: "session-a", openState: "open", openError: null, removed: false, running: false,
    nodes: [], partial: null, pending: [], runningCalls: [], turnTimings: new Map(),
    hasMore: false, loadingOlder: false, ...overrides,
  };
}

function paneProps(session, activeCopy, modelDirectories) {
  return {
    node: { type: "pane", id: "pane-a", sessionId: "session-a" },
    list: { ids: ["session-a"], byId: { "session-a": { id: "session-a", title: "Test session" } } },
    workspaces: { items: [] }, sessions: { binding: () => ({ session }) }, modelDirectories, active: true, paneCount: 1, activeCopy,
    onActive() {}, onSplit() {}, onRemove() {}, onReset() {}, onSwap() {}, onOpenMain() {},
  };
}

test("client bundle registers and installs its stylesheet", async () => {
  const { client, styles } = await loadClient();
  assert.deepEqual(Array.from(client.inject), ["slots", "sessions", "workspaces", "modelDirectories", "locale"]);
  assert.equal(typeof client.apply, "function");
  assert.equal(styles.length, 1);
  assert.equal(styles[0].dataset.plugin, "@syncended/dsh-split-screen");
  assert.match(styles[0].textContent, /dsh-split-workspace-view/);
  assert.match(styles[0].textContent, /dsh-split-compose-card/);
  assert.match(styles[0].textContent, /dsh-split-turn-status/);
  assert.match(styles[0].textContent, /@container dsh-split-pane/);
  assert.match(styles[0].textContent, /div\[data-slot="sidebar\.footer\.action"\]:has\(\.dsh-split-sidebar-toggle\) \{ display:flex!important; flex-direction:column/);
  assert.match(styles[0].textContent, /dsh-split-sidebar-toggle\[data-wide="true"\] \{ width:100%; height:49px/);
  assert.match(styles[0].textContent, /dsh-split-sidebar-toggle \{[^}]*color:var\(--dsw-alias-label-primary/);
  assert.doesNotMatch(styles[0].textContent, /dsh-split-overlay|dsh-split-launcher|dsh-split-compose-row/);
});

for (const centerSlot of ["main.conversation", "conversation"]) {
 test(`client toggles ${centerSlot} from the sidebar`, async () => {
  const { client, storage } = await loadClient();
  const injected = [];
  const registrations = [];
  let activeLocale = "en";
  const ctx = {
    sessions: { list: { getSnapshot: () => ({ current: undefined, byId: {} }), subscribe: () => () => {} } },
    workspaces: {}, modelDirectories: {},
    locale: { getLocale: () => ({ active: activeLocale }), getSnapshot: () => ({ active: activeLocale, revision: 0 }), subscribe: () => () => {} },
    effect(factory) { return factory(); },
    slots: {
      inject(name, factory) {
        injected.push(name);
        if (name === centerSlot || name === "sidebar.footer.action") return factory();
        return () => {};
      },
      register(options, component) {
        if (options.name !== centerSlot && options.name !== "sidebar.footer.action") throw new Error("slot is not declared");
        if (options.name === centerSlot && (options.priority ?? 0) === 0) throw new Error("native ConversationRoot already occupies priority 0");
        const row = { options, component, disposed: false };
        registrations.push(row);
        return () => { row.disposed = true; };
      },
    },
  };
  client.apply(ctx);
  assert.deepEqual(injected, ["main.conversation", "conversation", "sidebar.footer.action"]);
  const action = registrations[0];
  assert.equal(action.options.name, "sidebar.footer.action");
  assert.equal(action.options.id, "split-screen");
  assert.equal(action.options.label(), "Split");
  activeLocale = "zh";
  assert.equal(action.options.label(), "分屏");

  const toggle = byClass(render({ type: action.component, props: { wide: true } }), "dsh-split-sidebar-toggle")[0];
  assert.equal(toggle.props["aria-pressed"], false);
  toggle.props.onClick();
  assert.equal(storage.get("dsh.split-screen.center-mode.v1"), "true");
  assert.equal(registrations[1].options.name, centerSlot);
  assert.equal(registrations[1].options.priority, -100);
  assert.equal(typeof registrations[1].component, "function");
  toggle.props.onClick();
  assert.equal(storage.get("dsh.split-screen.center-mode.v1"), "false");
  assert.equal(registrations[1].disposed, true);
 });
}

test("saved split mode follows slot declarations and prefers the current slot", async () => {
  const { client, storage } = await loadClient();
  storage.set("dsh.split-screen.center-mode.v1", "true");
  const declarations = new Map();
  const registrations = [];
  const effects = [];
  const ctx = {
    sessions: {}, workspaces: {}, modelDirectories: {},
    locale: { getLocale: () => ({ active: "en" }) },
    effect(factory) { const dispose = factory(); effects.push(dispose); return dispose; },
    slots: {
      inject(name, factory) {
        const declaration = { factory, dispose: null };
        declarations.set(name, declaration);
        return () => declaration.dispose?.();
      },
      register(options, component) {
        const row = { options, component, disposed: false };
        registrations.push(row);
        return () => { row.disposed = true; };
      },
    },
  };
  const declare = (name) => {
    const declaration = declarations.get(name);
    declaration.dispose = declaration.factory();
  };
  const withdraw = (name) => {
    const declaration = declarations.get(name);
    declaration.dispose();
    declaration.dispose = null;
  };
  const mounted = () => registrations.filter((row) => !row.disposed).map((row) => row.options.name);
  client.apply(ctx);
  assert.deepEqual(mounted(), []);
  declare("conversation");
  assert.deepEqual(mounted(), ["conversation"]);
  declare("main.conversation");
  assert.deepEqual(mounted(), ["main.conversation"]);
  withdraw("conversation");
  assert.deepEqual(mounted(), ["main.conversation"]);
  withdraw("main.conversation");
  assert.deepEqual(mounted(), []);
  assert.equal(storage.get("dsh.split-screen.center-mode.v1"), "true");
  declare("main.conversation");
  declare("conversation");
  assert.deepEqual(mounted(), ["main.conversation"]);
  const registrationsBeforeDisposal = registrations.length;
  for (const dispose of effects.reverse()) dispose();
  assert.deepEqual(mounted(), []);
  assert.equal(registrations.length, registrationsBeforeDisposal, "teardown must not remount a fallback slot");
});

test("center workspace exits back to the active pane native chat", async () => {
  const { client, storage } = await loadClient();
  const api = client.__testing;
  storage.set("dsh.split-screen.layout.v1", JSON.stringify({ type: "pane", id: "pane-b", sessionId: "session-b", tabs: ["session-b"] }));
  storage.set("dsh.split-screen.active-pane.v1", "pane-b");
  const opened = [];
  let exited = 0;
  const snapshot = openSnapshot({ sessionId: "session-b" });
  const session = { subscribe: () => () => {}, getSnapshot: () => snapshot, projections: { faceOf: () => ({ subscribe: () => () => {}, getSnapshot: () => undefined }) }, async prompt() { return { ok: true }; }, async cancel() { return { ok: true }; } };
  const list = { ids: ["session-a", "session-b"], current: "session-a", phase: "ready", byId: { "session-a": { id: "session-a", title: "Alpha" }, "session-b": { id: "session-b", title: "Beta" } } };
  const sessions = { list: { subscribe: () => () => {}, getSnapshot: () => list }, binding: () => ({ session }), open: (id) => { opened.push(id); list.current = id; } };
  const workspaces = { list: { subscribe: () => () => {}, getSnapshot: () => ({ items: [] }) } };
  const locale = { subscribe: () => () => {}, getSnapshot: () => ({ active: "en" }) };
  const tree = render({ type: api.SplitScreenEntry, props: { sessions, workspaces, locale, sessionId: "session-a", onExit: () => { exited += 1; } } });
  byClass(tree, "dsh-split-workspace-exit")[0].props.onClick();
  assert.deepEqual(opened, ["session-b"]);
  assert.equal(exited, 1);
});

test("neighbor session updates do not invalidate a focused pane", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const node = api.pane("session-a", "pane-a");
  const ownSummary = { id: "session-a", title: "Alpha" };
  const before = {
    node, active: true, paneCount: 2, workspaces: {}, sessions: {}, modelDirectories: {}, activeCopy: api.copy("en"),
    list: { ids: ["session-a", "session-b"], byId: { "session-a": ownSummary, "session-b": { id: "session-b", running: true } } },
  };
  const neighborSettled = {
    ...before,
    list: { ids: ["session-a", "session-b"], byId: { "session-a": ownSummary, "session-b": { id: "session-b", running: false } } },
  };
  assert.equal(api.equalPaneProps(before, neighborSettled), true);
  assert.equal(api.equalPaneProps(before, { ...neighborSettled, list: { ...neighborSettled.list, byId: { ...neighborSettled.list.byId, "session-a": { ...ownSummary, title: "Renamed" } } } }), false);
  assert.equal(api.equalPaneProps(before, { ...neighborSettled, active: false }), false);
});

test("composer focus and caret survive a textarea remount", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const body = {};
  const documentElement = {};
  const ownerDocument = { body, documentElement, activeElement: body };
  const previous = { value: "hello", selectionStart: 2, selectionEnd: 4, selectionDirection: "forward" };
  api.rememberComposerFocus("pane-a:session-a", previous);
  const restored = {
    ownerDocument, value: "hello",
    focus() { ownerDocument.activeElement = this; },
    setSelectionRange(start, end, direction) { this.selection = [start, end, direction]; },
  };
  assert.equal(api.restoreComposerFocus("pane-a:session-a", restored), true);
  assert.deepEqual(restored.selection, [2, 4, "forward"]);
  api.releaseComposerFocus("pane-a:session-a");
  ownerDocument.activeElement = body;
  assert.equal(api.restoreComposerFocus("pane-a:session-a", restored), false);
});

test("layout tree supports nested splits, resize, remove, and session swap", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const first = api.pane("session-a", "pane-a");
  const withRight = api.splitPane(first, "pane-a", "row", api.pane("session-b", "pane-b"));
  const nested = api.splitPane(withRight, "pane-b", "column", api.pane("session-c", "pane-c"));

  assert.equal(api.countPanes(nested), 3);
  assert.deepEqual(Array.from(api.paneIds(nested)), ["pane-a", "pane-b", "pane-c"]);
  assert.deepEqual(Array.from(api.sessionIds(nested)), ["session-a", "session-b", "session-c"]);
  assert.equal(nested.direction, "row");
  assert.equal(nested.second.direction, "column");

  const tabbed = api.setPaneSession(nested, "pane-b", "session-d");
  assert.deepEqual(plain(tabbed.second.first.tabs), ["session-b", "session-d"]);
  assert.equal(tabbed.second.first.sessionId, "session-d");
  assert.equal(api.paneForSession(tabbed, "session-d"), "pane-b");
  assert.equal(api.sessionForPane(tabbed, "pane-b"), "session-d");
  const closed = api.closePaneSession(tabbed, "pane-b", "session-d");
  assert.equal(closed.second.first.sessionId, "session-b");
  assert.deepEqual(plain(closed.second.first.tabs), ["session-b"]);

  const resized = api.setSplitRatio(nested, nested.id, 0.01);
  assert.equal(resized.ratio, 0.15);
  const swapped = api.swapPaneSessions(resized, "pane-a", "pane-c");
  assert.deepEqual(Array.from(api.sessionIds(swapped)), ["session-c", "session-b", "session-a"]);

  const removed = api.removePane(swapped, "pane-b");
  assert.equal(api.countPanes(removed), 2);
  assert.deepEqual(Array.from(api.paneIds(removed)), ["pane-a", "pane-c"]);
});

test("pane-local chat tabs render and dispatch selection independently", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const node = api.setPaneSession(api.pane("session-a", "pane-a"), "pane-a", "session-b");
  const list = {
    ids: ["session-a", "session-b", "session-c"],
    byId: {
      "session-a": { id: "session-a", title: "Alpha" },
      "session-b": { id: "session-b", title: "Beta", running: true },
      "session-c": { id: "session-c", title: "Gamma" },
    },
  };
  const selected = [];
  const closed = [];
  const tree = render({ type: api.PaneTabs, props: {
    node, list, activeState: "running", activeCopy: api.copy("en"),
    onSelect: (id) => selected.push(id), onClose: (id) => closed.push(id), onAdd() {},
  } });
  assert.deepEqual(byClass(tree, "dsh-split-tab-label").map((row) => row.children), ["Alpha", "Beta"]);
  assert.equal(byClass(tree, "dsh-split-tab")[1].props["data-active"], true);
  byClass(tree, "dsh-split-tab-main")[0].props.onClick();
  byClass(tree, "dsh-split-tab-main")[0].props.onKeyDown({ key: "ArrowRight", preventDefault() {} });
  byClass(tree, "dsh-split-tab-close")[1].props.onClick({ stopPropagation() {} });
  assert.deepEqual(selected, ["session-a", "session-b"]);
  assert.deepEqual(closed, ["session-b"]);
  assert.equal(byClass(tree, "dsh-split-tab-add").length, 1);
});

test("persisted layouts are validated and bounded", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const valid = {
    type: "split",
    id: "root",
    direction: "column",
    ratio: 2,
    first: { type: "pane", id: "one", sessionId: "s1" },
    second: { type: "pane", id: "two", sessionId: "s2" },
  };
  assert.deepEqual(plain(api.sanitizeLayout(valid)), {
    ...valid,
    ratio: 0.85,
    first: { ...valid.first, tabs: ["s1"] },
    second: { ...valid.second, tabs: ["s2"] },
  });
  assert.equal(api.sanitizeLayout({ type: "other" }), null);
  const duplicate = { ...valid, second: { type: "pane", id: "one", sessionId: "s2" } };
  assert.deepEqual(plain(api.sanitizeLayout(duplicate)), { type: "pane", id: "one", sessionId: "s1", tabs: ["s1"] });
});

test("observable adapters preserve method receivers", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const observable = {
    value: 42,
    getSnapshot() { return this.value; },
    subscribe(fn) { assert.equal(this, observable); fn(); return () => {}; },
  };
  assert.equal(api.observableSnapshot(observable, 0), 42);
  assert.equal(typeof api.observableSubscribe(observable, () => {}), "function");
});

test("focused pane persists for native sidebar selection", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const layout = api.splitPane(api.pane("session-a", "pane-a"), "pane-a", "row", api.pane("session-b", "pane-b"));
  assert.equal(api.loadActivePane(layout), "pane-a");
  api.saveActivePane("pane-b");
  assert.equal(api.loadActivePane(layout), "pane-b");
});

test("pane drafts persist by pane and session key", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  api.saveDraft("pane-a:session-a", "unfinished message");
  assert.equal(api.loadDraft("pane-a:session-a"), "unfinished message");
  assert.equal(api.loadDraft("pane-a:session-b"), "");
  api.saveDraft("pane-a:session-a", "");
  assert.equal(api.loadDraft("pane-a:session-a"), "");
});

test("compact transcript projection keeps chat, tool, and failure rows", async () => {
  const { client } = await loadClient();
  const copy = {
    image: "[Image]", reasoning: "Reasoning", user: "You", agent: "Agent", system: "Status",
    tool: "Tool", interrupted: "Stopped", unknownError: "Error", maxTokens: "Limit", retry: "Retry",
  };
  const api = client.__testing;
  assert.deepEqual(plain(api.projectNode({ kind: "assistant", seq: 3, blocks: [{ kind: "text", text: "done" }] }, copy)), {
    role: "assistant", label: "Agent", reasoningLabel: "Reasoning", imageLabel: "[Image]", text: "done", blocks: [{ kind: "text", text: "done" }], key: "assistant-3",
  });
  const toolNode = { kind: "tool-result", seq: 4, callId: "c1", call: { name: "bash" }, content: [{ type: "text", text: "ok" }], isError: false };
  assert.deepEqual(plain(api.projectNode(toolNode, copy)), {
    role: "tool", label: "Tool", text: "✓ bash\nok", tool: toolNode, key: "tool-4",
  });
  assert.equal(api.projectNode({ kind: "unknown", seq: 5 }, copy), null);
  assert.deepEqual(plain(api.projectNode({ kind: "assistant", seq: 6, blocks: [], interrupted: true }, copy)), {
    role: "assistant", label: "Agent", reasoningLabel: "Reasoning", imageLabel: "[Image]", text: "Stopped", blocks: [],
    interrupted: true, interruptedLabel: "Stopped", key: "assistant-6",
  });
});

test("native-style activity labels and durations stay compact and localized", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  assert.equal(api.displayToolTitle("bash"), "Bash");
  assert.equal(api.displayToolTitle("ask_user_question"), "Question");
  assert.equal(api.displayToolTitle("custom_tool"), "Custom Tool");
  assert.equal(api.formatRunDuration(14_000, { durationSeconds: "{seconds}s", durationMinutes: "{minutes}m {seconds}s" }), "14s");
  assert.equal(api.formatRunDuration(84_000, { durationSeconds: "{seconds} с", durationMinutes: "{minutes} мин {seconds} с" }), "1 мин 24 с");
  assert.equal(api.formatRunDuration(84_000, { durationSeconds: "{seconds}秒", durationMinutes: "{minutes}分{seconds}秒" }), "1分24秒");
  const toolCopy = { tool: "Tool", toolRunning: "Running", toolDone: "Completed", toolFailed: "Failed", image: "[Image]" };
  const running = api.toolPresentation({ callId: "r1", name: "bash", argsRaw: "npm test", subCalls: [] }, true, toolCopy);
  assert.equal(running.summary, "npm test");
  assert.equal(running.input, "", "one-line input must not repeat inside details");
  const settled = api.toolPresentation({
    kind: "tool-result", callId: "r1", call: { name: "bash", argsRaw: "npm test" }, content: [{ type: "text", text: "ok" }], isError: false,
    callView: null, resultView: null, subCalls: [],
  }, false, toolCopy);
  assert.equal(settled.summary, "ok");
  assert.equal(settled.output, "", "one-line output must not repeat inside details");
  assert.equal(settled.input, "npm test");
});

test("keyed chat order interleaves running, nested, and settled tool calls", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const running = {
    callId: "bash-root", name: "bash", argsRaw: "{\"command\":\"build\"}", callView: null,
    subCalls: [{
      callId: "read-child", name: "read", argsRaw: "{\"file_path\":\"package.json\"}", callView: null,
      subCalls: [{ callId: "grep-grandchild", name: "grep", argsRaw: "{\"pattern\":\"scripts\"}", callView: null, subCalls: [] }],
    }],
  };
  const settled = {
    kind: "tool-result", seq: 9, callId: "write-root", call: { name: "write", argsRaw: "{\"file_path\":\"out.txt\"}" },
    content: [{ type: "text", text: "write failed" }], isError: true, error: { name: "WriteError", code: "EWRITE" }, callView: null, resultView: null, subCalls: [],
  };
  const nodes = new Map([
    ["tool:running", { key: "tool:running", kind: "tool-call", anchorSeq: 4, visibility: "visible", data: { root: running } }],
    ["tool:settled", { key: "tool:settled", kind: "tool-call", anchorSeq: 8, visibility: "visible", data: { root: settled } }],
  ]);
  const snapshot = {
    openState: "open", openError: null, running: true, hasMore: false, loadingOlder: false,
    chat: { order: ["tool:running", "tool:settled"], nodes, timeline: { turns: new Map() } },
    nodes: [settled], partial: null, runningCalls: [running], turnTimings: new Map(),
  };

  const items = api.orderedConversationItems(snapshot);
  assert.deepEqual(items.map((item) => item.key), ["tool:running", "tool:settled"]);
  assert.equal(items[0].tool.subCalls[0].callId, "read-child");

  const tree = render({ type: api.MessageList, props: { session: {}, snapshot, activeCopy: api.copy("en") } });
  assert.deepEqual(byType(tree, "DisclosureRow").map((row) => row.props.title), ["Bash", "Read", "Grep", "Write"]);
  assert.deepEqual(byClass(tree, "dsh-split-tool").map((row) => row.props["data-chat-call-id"]), ["bash-root", "read-child", "grep-grandchild", "write-root"]);
  assert.equal(byClass(tree, "dsh-split-turn-status").length, 1);
  assert.equal(byClass(tree, "dsh-split-empty").length, 0);
});

test("keyed interrupted assistant renders a compact stopped badge", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const interrupted = {
    key: "assistant:stopped", kind: "assistant-step", anchorSeq: 11, visibility: "visible",
    data: { status: "interrupted", turn: 1, step: 2, blocks: [] },
  };
  const snapshot = {
    openState: "open", openError: null, running: false, hasMore: false, loadingOlder: false,
    chat: { order: [interrupted.key], nodes: new Map([[interrupted.key, interrupted]]), timeline: { turns: new Map() } },
    nodes: [], partial: null, runningCalls: [], turnTimings: new Map(),
  };
  const tree = render({ type: api.MessageList, props: { session: {}, snapshot, activeCopy: api.copy("en") } });
  const badges = byClass(tree, "dsh-split-message-stopped");
  assert.equal(badges.length, 1);
  assert.equal(badges[0].children, "Response stopped");
  assert.equal(byClass(tree, "dsh-split-empty").length, 0);
});

test("populated transcripts support current primitives without MessageText and with required Markdown labels", async () => {
  const { client } = await loadClient({ primitiveOverrides: { MessageText: undefined } });
  const api = client.__testing;
  const userText = "<script>not markup</script>\nplain user text";
  const markdown = "```js\nconsole.log('hello');\n```\nFootnote[^1]\n\n[^1]: A note";
  const snapshot = openSnapshot({
    nodes: [
      { kind: "user", seq: 1, content: [{ type: "text", text: userText }] },
      { kind: "assistant", seq: 2, blocks: [{ kind: "text", text: markdown }] },
    ],
    partial: { turn: 2, step: 1, blocks: [{ kind: "text", text: markdown }] },
  });
  for (const locale of ["en", "ru", "zh"]) {
    const tree = render({ type: api.MessageList, props: { session: {}, snapshot, activeCopy: api.copy(locale) } });
    const user = byClass(tree, "dsh-split-message").find((node) => node.props["data-role"] === "user");
    assert.equal(user.children, userText, "fallback renders escaped text, not HTML or Markdown");
    assert.equal(byType(tree, "MessageText").length, 0);
    const markdownNodes = byType(tree, "MarkdownText");
    assert.equal(markdownNodes.length, 2);
    assert.deepEqual(markdownNodes.map((node) => node.props.streaming), [false, true]);
    for (const node of markdownNodes) {
      assert.equal(node.props.text, markdown);
      assert.equal(node.props.labels, api.copy(locale).markdownLabels, "localized labels have stable identity");
    }
  }
});

test("pane subscribes to the separate Chat target with lifecycle-only Session snapshots", async () => {
  const cleanups = [];
  const { client } = await loadClient({
    useSyncExternalStore(subscribe, getSnapshot) {
      cleanups.push(subscribe(() => {}));
      const value = getSnapshot();
      assert.equal(getSnapshot(), value, "external snapshots must retain identity between updates");
      return value;
    },
  });
  const api = client.__testing;
  const lifecycle = {
    sessionId: "session-a", openState: "open", openError: null, removed: false,
    running: false, queue: [], pendingSubmissions: [], hasMore: false, loadingOlder: false,
  };
  const session = { sessionId: "session-a", subscribe: () => () => {}, getSnapshot: () => lifecycle };
  let chat;
  let subscriptions = 0;
  let releases = 0;
  const makeChat = (text) => ({
    order: ["user:1"],
    nodes: new Map([["user:1", { key: "user:1", kind: "user", data: { kind: "user", seq: 1, content: [{ type: "text", text }] } }]]),
    timeline: { turns: new Map() },
  });
  const target = {
    subscribe() {
      subscriptions += 1;
      // Installed DSH activates the target on its first subscription.
      chat ||= makeChat("Separate chat target");
      return () => { releases += 1; };
    },
    getSnapshot: () => chat,
  };
  const uiConversation = { binding(id) {
    assert.equal(id, "session-a");
    return { target(name) { assert.equal(name, "chat"); return target; } };
  } };
  const props = { ...paneProps(session, api.copy("en")), uiConversation };
  let tree = render({ type: api.PaneView, props });
  assert.equal(byType(tree, "MessageText")[0].props.text, "Separate chat target");
  assert.equal(byClass(tree, "dsh-split-empty").length, 0);
  assert.equal(byType(tree, "textarea")[0].props.disabled, false, "lifecycle fields remain available");
  chat = makeChat("Updated target, unchanged lifecycle");
  tree = render({ type: api.PaneView, props });
  assert.equal(byType(tree, "MessageText")[0].props.text, "Updated target, unchanged lifecycle");
  assert.equal(subscriptions, 2);
  const list = { ...props.list, current: "session-a" };
  const workspaces = { items: [] };
  tree = render({ type: api.SplitScreenEntry, props: {
    sessions: { ...props.sessions, list: { subscribe: () => () => {}, getSnapshot: () => list } },
    workspaces: { list: { subscribe: () => () => {}, getSnapshot: () => workspaces } },
    uiConversation,
    onExit() {},
  } });
  assert.equal(byType(tree, "MessageText")[0].props.text, "Updated target, unchanged lifecycle", "entry forwards assembly through the pane tree");
  assert.equal(subscriptions, 3);
  assert.equal(api.equalPaneProps(props, { ...props }), true);
  assert.equal(api.equalPaneProps(props, { ...props, uiConversation: {} }), false);
  for (const cleanup of cleanups) cleanup();
  assert.equal(releases, 3);
});

test("pane preserves legacy transcripts when Chat assembly is absent or not yet published", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const snapshot = openSnapshot({ nodes: [{ kind: "user", seq: 1, content: [{ type: "text", text: "Legacy transcript" }] }] });
  const session = { sessionId: "session-a", subscribe: () => () => {}, getSnapshot: () => snapshot };
  for (const uiConversation of [undefined, { binding: () => ({ target: () => ({ subscribe: () => () => {}, getSnapshot: () => undefined }) }) }]) {
    const props = { ...paneProps(session, api.copy("en")), uiConversation };
    const tree = render({ type: api.PaneView, props });
    assert.equal(byType(tree, "MessageText")[0].props.text, "Legacy transcript");
  }
});

test("pane composer switches between queued Send and Stop controls", async () => {
  const { client, storage } = await loadClient();
  const api = client.__testing;
  storage.set("dsh.split-screen.drafts.v1", JSON.stringify({ "pane-a:session-a": "  hello agent  " }));
  let snapshot = openSnapshot();
  const promptCalls = [];
  let cancelCalls = 0;
  const session = {
    subscribe: () => () => {}, getSnapshot: () => snapshot,
    async prompt(content, placement) { promptCalls.push({ content, placement }); return { ok: true }; },
    async cancel() { cancelCalls += 1; return { ok: true }; },
  };
  const props = paneProps(session, api.copy("en"));

  let tree = render({ type: api.PaneView, props });
  let control = byClass(tree, "dsh-split-send")[0];
  assert.equal(control.props.type, "submit");
  assert.equal(control.props["aria-label"], "Send");
  assert.equal(control.props["data-stop"], undefined);
  assert.equal(control.props.disabled, false);
  byClass(tree, "dsh-split-compose")[0].props.onSubmit({ preventDefault() {} });
  assert.deepEqual(plain(promptCalls), [{ content: [{ type: "text", text: "hello agent" }], placement: "queue" }]);

  snapshot = openSnapshot({ running: true });
  tree = render({ type: api.PaneView, props });
  control = byClass(tree, "dsh-split-send")[0];
  assert.equal(control.props.type, "button");
  assert.equal(control.props["aria-label"], "Stop");
  assert.equal(control.props["data-stop"], true);
  assert.equal(control.props.disabled, false);
  control.props.onClick();
  assert.equal(cancelCalls, 1);
});

test("empty draft disables Send without disabling Stop", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  let snapshot = openSnapshot();
  const session = { subscribe: () => () => {}, getSnapshot: () => snapshot, async prompt() {}, async cancel() {} };
  const props = paneProps(session, api.copy("en"));
  let control = byClass(render({ type: api.PaneView, props }), "dsh-split-send")[0];
  assert.equal(control.props.disabled, true);
  snapshot = openSnapshot({ running: true });
  control = byClass(render({ type: api.PaneView, props }), "dsh-split-send")[0];
  assert.equal(control.props.disabled, false);
  assert.equal(control.props["data-stop"], true);
});

test("session metrics include context, throughput, token usage, and cache rate", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const segments = api.statsSegments(
    { turns: 2, steps: 3, decodeMs: 1000, decodeTokens: 40 },
    { uncachedInputTokens: 100, cacheReadTokens: 300, cacheWriteTokens: 0, outputTokens: 50 },
    { projectedTokens: 32768, contextWindow: 65536 },
    api.copy("en"),
  );
  assert.deepEqual(plain(segments), ["Context 50% · 32.8K/65.5K", "2 turns · 3 steps", "40 tok/s", "Input 400 · Output 50", "cache 75%"]);
  assert.deepEqual(plain(api.contextOccupancy({ pressureTokens: 10, contextWindow: 40 })), { usedTokens: 10, contextWindow: 40, percent: 25 });
});

test("pane exposes functional access and model selectors", async () => {
  const { client } = await loadClient();
  const api = client.__testing;
  const projectionValues = {
    permissions: {
      currentValue: "workspace-write",
      options: [
        { value: "read-only", name: "read-only" },
        { value: "workspace-write", name: "workspace-write" },
        { value: "danger-full-access", name: "danger-full-access" },
      ],
    },
    contextPressure: { projectedTokens: 24000, contextWindow: 120000 },
    sessionStats: { turns: 1, steps: 2, decodeMs: 2000, decodeTokens: 50 },
    tokenUsage: { uncachedInputTokens: 1000, cacheReadTokens: 3000, cacheWriteTokens: 0, outputTokens: 500 },
  };
  const commandCalls = [];
  const modelCalls = [];
  const session = {
    subscribe: () => () => {}, getSnapshot: () => openSnapshot(),
    projections: { faceOf: (key) => ({ subscribe: () => () => {}, getSnapshot: () => projectionValues[key] }) },
    async prompt() { return { ok: true }; }, async cancel() { return { ok: true }; },
    async command(line) { commandCalls.push(line); return { ok: true, value: { matched: true } }; },
  };
  const modelState = {
    current: { provider: "deepseek", model: "v3" }, routable: true, status: "ready", error: null, failures: [],
    groups: [{ id: "deepseek", name: "DeepSeek", models: [{ id: "v3", name: "V3" }, { id: "r1", name: "R1", reasoning: { defaultEffort: "high" } }] }],
  };
  const modelDirectories = {
    directoryFor: () => ({
      store: { subscribe: () => () => {}, getSnapshot: () => modelState },
      async load() {}, async select(selection) { modelCalls.push(selection); },
    }),
  };
  const props = paneProps(session, api.copy("en"), modelDirectories);
  const tree = render({ type: api.PaneView, props });
  const selectors = byClass(tree, "dsh-split-control-selector");
  const permission = selectors.find((node) => node.props["data-kind"] === "permission");
  const model = selectors.find((node) => node.props["data-kind"] === "model");
  assert.ok(permission);
  assert.ok(model);
  assert.equal(byType(tree, "select").length, 0);
  assert.equal(byClass(permission, "dsh-split-control-icon").length, 1);
  assert.equal(byClass(model, "dsh-split-control-icon").length, 1);
  assert.equal(byClass(permission, "dsh-split-control-label")[0].children, "Workspace Write");
  assert.equal(byClass(model, "dsh-split-control-label")[0].children, "V3");
  const contextTrigger = byClass(tree, "dsh-split-context-trigger")[0];
  assert.equal(contextTrigger.props["aria-haspopup"], "dialog");
  assert.equal(contextTrigger.props["aria-expanded"], false);
  const contextProgress = findAll(contextTrigger, (node) => node.props && node.props.role === "progressbar")[0];
  assert.equal(contextProgress.props["aria-valuenow"], 20);
  assert.equal(contextProgress.props["aria-valuemin"], 0);
  assert.equal(contextProgress.props["aria-valuemax"], 100);
  assert.equal(byClass(contextTrigger, "dsh-split-context-label")[0].children, "20%");
  const contextOpen = render({ type: api.ContextControl, props: { context: api.contextOccupancy(projectionValues.contextPressure), activeCopy: api.copy("en"), initiallyOpen: true } });
  assert.equal(byClass(contextOpen, "dsh-split-context-popover").length, 1);
  assert.deepEqual(byClass(contextOpen, "dsh-split-context-rows")[0].children.map((node) => node.children), ["Used", "24K", "Remaining", "96K", "Limit", "120K"]);
  assert.deepEqual(byClass(tree, "dsh-split-stat").map((node) => node.children), ["Context 20% · 24K/120K", "1 turns · 2 steps", "25 tok/s", "Input 4K · Output 500", "cache 75%"]);

  const rawPane = api.PaneView(props);
  const rawControls = findRaw(rawPane, (node) => node.type === api.ComposerControls)[0];
  await rawControls.props.onPermission("read-only");
  await rawControls.props.onPermission("danger-full-access");
  await rawControls.props.onModel("deepseek\u0000r1");
  assert.deepEqual(commandCalls, ["/permission read-only"], "Full access must fail closed when confirmation is unavailable");
  assert.deepEqual(plain(modelCalls), [{ provider: "deepseek", model: "r1", reasoningEffort: "high" }]);
});
