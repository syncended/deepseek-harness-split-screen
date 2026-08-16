import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadClient() {
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
    createElement: (...args) => ({ args }),
    useCallback: (fn) => fn,
    useEffect() {},
    useRef: () => ({ current: null }),
    useState: (value) => [typeof value === "function" ? value() : value, () => {}],
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  };
  const client = definition.factory((id) => {
    if (id === "react") return React;
    if (id === "@deepseek-ai/dsh-client-ui-primitives") return {
      DisclosureRow: function DisclosureRow() {},
      IconApiOutline14: function IconApiOutline14() {},
      IconThinkOutline14: function IconThinkOutline14() {},
      MarkdownText: function MarkdownText() {},
      MessageText: function MessageText() {},
      StateDot: function StateDot() {},
    };
    throw new Error(`Unexpected require: ${id}`);
  });
  return { client, styles };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("client bundle registers and installs its stylesheet", async () => {
  const { client, styles } = await loadClient();
  assert.deepEqual(Array.from(client.inject), ["slots", "sessions", "workspaces", "locale"]);
  assert.equal(typeof client.apply, "function");
  assert.equal(styles.length, 1);
  assert.equal(styles[0].dataset.plugin, "@syncended/dsh-split-screen");
  assert.match(styles[0].textContent, /dsh-split-workspace-view/);
  assert.doesNotMatch(styles[0].textContent, /dsh-split-overlay|dsh-split-launcher/);
});

test("client contributes one additive conversation view", async () => {
  const { client } = await loadClient();
  let slot;
  let registration;
  let activeLocale = "en";
  const ctx = {
    sessions: { list: { getSnapshot: () => ({ current: undefined }), subscribe: () => () => {} } },
    workspaces: {},
    locale: { getLocale: () => ({ active: activeLocale }), getSnapshot: () => ({ active: activeLocale, revision: 0 }), subscribe: () => () => {} },
    effect(factory) { return factory(); },
    slots: {
      inject(name, factory) { slot = name; return factory(); },
      register(options, component) { registration = { options, component }; return () => {}; },
    },
  };
  client.apply(ctx);
  assert.equal(slot, "conversation.view");
  assert.equal(registration.options.id, "split-screen");
  assert.equal(registration.options.name, "conversation.view");
  assert.equal(registration.options.order, 100);
  assert.equal(registration.options.label(), "Split");
  activeLocale = "zh";
  assert.equal(registration.options.label(), "分屏");
  assert.equal(typeof registration.component, "function");
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

  const resized = api.setSplitRatio(nested, nested.id, 0.01);
  assert.equal(resized.ratio, 0.15);
  const swapped = api.swapPaneSessions(resized, "pane-a", "pane-c");
  assert.deepEqual(Array.from(api.sessionIds(swapped)), ["session-c", "session-b", "session-a"]);

  const removed = api.removePane(swapped, "pane-b");
  assert.equal(api.countPanes(removed), 2);
  assert.deepEqual(Array.from(api.paneIds(removed)), ["pane-a", "pane-c"]);
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
  });
  assert.equal(api.sanitizeLayout({ type: "other" }), null);
  const duplicate = { ...valid, second: { type: "pane", id: "one", sessionId: "s2" } };
  assert.deepEqual(plain(api.sanitizeLayout(duplicate)), { type: "pane", id: "one", sessionId: "s1" });
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
  assert.deepEqual(plain(api.projectNode({ kind: "tool-result", seq: 4, callId: "c1", call: { name: "bash" }, content: [{ type: "text", text: "ok" }], isError: false }, copy)), {
    role: "tool", label: "Tool", text: "✓ bash\nok", key: "tool-4",
  });
  assert.equal(api.projectNode({ kind: "unknown", seq: 5 }, copy), null);
});
