import * as vscode from "vscode";
import { exec } from "child_process";

// ── Types ────────────────────────────────────────────────────────────────────

type Status = "success" | "warning" | "error" | "running" | "unknown";

interface StatusConfig {
  command: string;
  envVariable: string;
  intervalSeconds: number;
  successPattern: string;
  warningPattern: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getConfig(): StatusConfig {
  const cfg = vscode.workspace.getConfiguration("statusMonitor");
  return {
    command:        cfg.get<string>("command",         "echo ok"),
    envVariable:    cfg.get<string>("envVariable",     ""),
    intervalSeconds:cfg.get<number>("intervalSeconds", 10),
    successPattern: cfg.get<string>("successPattern",  "ok"),
    warningPattern: cfg.get<string>("warningPattern",  "warn"),
  };
}

function parseOutput(output: string, cfg: StatusConfig): Status {
  const text = output.trim().toLowerCase();
  if (new RegExp(cfg.successPattern, "i").test(text)) { return "success"; }
  if (new RegExp(cfg.warningPattern, "i").test(text)) { return "warning"; }
  return "error";
}

function runCommand(cfg: StatusConfig): Promise<{ status: Status; output: string }> {
  return new Promise((resolve) => {
    // Merge the watched env variable into the child process environment
    const env: NodeJS.ProcessEnv = { ...process.env };
    if (cfg.envVariable) {
      const value = process.env[cfg.envVariable];
      if (value !== undefined) {
        env[cfg.envVariable] = value;
      }
    }

    exec(cfg.command, { env, timeout: 10_000 }, (err, stdout, stderr) => {
      const output = (stdout + stderr).trim();
      if (err && !output) {
        resolve({ status: "error", output: err.message });
      } else {
        resolve({ status: parseOutput(output, cfg), output });
      }
    });
  });
}

// ── Status Bar UI ─────────────────────────────────────────────────────────────

const ICONS: Record<Status, string> = {
  success: "$(pass-filled)",   // ✅ green circle
  warning: "$(warning)",       // ⚠️  yellow
  error:   "$(error)",         // ❌ red
  running: "$(sync~spin)",     // 🔄 spinner
  unknown: "$(question)",      // ❓
};

const COLORS: Record<Status, vscode.ThemeColor | undefined> = {
  success: new vscode.ThemeColor("statusBarItem.prominentBackground"), // subtle green tint
  warning: new vscode.ThemeColor("statusBarItem.warningBackground"),
  error:   new vscode.ThemeColor("statusBarItem.errorBackground"),
  running: undefined,
  unknown: undefined,
};

const LABEL_KEYS: Partial<Record<Status, string>> = {
  success: "labelSuccess",
  warning: "labelWarning",
  error:   "labelFailure",
};

function applyStatus(item: vscode.StatusBarItem, status: Status, tooltip: string) {
  const cfg = vscode.workspace.getConfiguration("statusMonitor");
  const statusKey = LABEL_KEYS[status];
  const label = (statusKey && cfg.get<string>(statusKey, "")) || cfg.get<string>("label", "");
  item.text            = label ? `${ICONS[status]} ${label}` : ICONS[status];
  item.tooltip         = tooltip;
  item.backgroundColor = COLORS[status];
  item.show();
}

// ── Extension lifecycle ───────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  item.command = "statusMonitor.runNow";

  let timer: ReturnType<typeof setInterval> | undefined;
  let lastOutput = "";

  // ── Core refresh logic ──
  async function refresh() {
    const cfg = getConfig();
    applyStatus(item, "running", "Running command…");
    const { status, output } = await runCommand(cfg);
    lastOutput = output;
    applyStatus(
      item,
      status,
      `Command: ${cfg.command}\n` +
      (cfg.envVariable ? `Env var: ${cfg.envVariable} = ${process.env[cfg.envVariable] ?? "(not set)"}\n` : "") +
      `Output: ${output || "(empty)"}\n` +
      `Click to refresh`
    );
  }

  function startTimer() {
    if (timer) { clearInterval(timer); }
    const cfg = getConfig();
    timer = setInterval(refresh, cfg.intervalSeconds * 1000);
  }

  // ── Register commands ──
  context.subscriptions.push(
    vscode.commands.registerCommand("statusMonitor.runNow", () => {
      refresh();
    }),

    vscode.commands.registerCommand("statusMonitor.showOutput", () => {
      vscode.window.showInformationMessage(`Last output:\n${lastOutput}`);
    }),

    // React to settings changes immediately
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("statusMonitor")) {
        startTimer();
        refresh();
      }
    }),

    item
  );

  // ── Kick off ──
  applyStatus(item, "unknown", "Status Monitor — click to run");
  item.show();
  refresh();
  startTimer();
}

export function deactivate() {
  // VS Code disposes StatusBarItem via context.subscriptions automatically
}
