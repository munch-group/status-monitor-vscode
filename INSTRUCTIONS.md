# Status Monitor — Build & Package Instructions

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node)
- [VS Code](https://code.visualstudio.com/)

---

## 1. Install dependencies

```bash
cd status-monitor-vscode
npm install
```

---

## 2. Compile TypeScript

```bash
npm run compile
```

This produces the `out/` folder containing the compiled JavaScript.

---

## 3. Run in development (optional)

1. Open the `status-monitor-vscode` folder in VS Code
2. Press **F5** — this launches a new *Extension Development Host* window with the extension loaded
3. Configure it via **Settings → Status Monitor**

---

## 4. Package as .vsix

Install the VS Code Extension packaging tool:

```bash
npm install -g @vscode/vsce
```

Then package:

```bash
vsce package
```

This produces **`status-monitor-0.0.1.vsix`** in the current directory.

---

## 5. Install the .vsix in VS Code

**Option A — Command Palette:**
1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type `Extensions: Install from VSIX...`
4. Select the `.vsix` file

**Option B — CLI:**
```bash
code --install-extension status-monitor-0.0.1.vsix
```

---

## Configuration (settings.json)

After installing, configure via VS Code Settings or directly in `settings.json`:

```jsonc
{
  // Shell command to run
  "statusMonitor.command": "echo ok",

  // Env variable name to forward into the command environment (optional)
  "statusMonitor.envVariable": "MY_API_KEY",

  // How often to re-run, in seconds
  "statusMonitor.intervalSeconds": 10,

  // Regex: output matching this → green ✅
  "statusMonitor.successPattern": "ok|healthy",

  // Regex: output matching this → yellow ⚠️  (checked after success)
  "statusMonitor.warningPattern": "warn|degraded",

  // Default label shown next to the icon (empty = icon only)
  "statusMonitor.label": "Monitor",

  // Status-specific labels (fall back to statusMonitor.label if empty)
  "statusMonitor.labelSuccess": "",
  "statusMonitor.labelWarning": "",
  "statusMonitor.labelFailure": ""
}
```

The status bar item appears on the **bottom-right** of VS Code.  
Click it to refresh immediately. Hover for full command output.
