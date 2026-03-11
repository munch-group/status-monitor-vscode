# Status Monitor — VS Code Extension

Runs a shell command on an interval and reflects the result as a **colored icon in the status bar**.

- **Green** — output matches your success pattern
- **Yellow** — output matches your warning pattern  
- **Red** — everything else / command failed

Click the icon to refresh immediately. Hover for full output.

## Install the .vsix in VS Code

**Option A — Command Palette:**
1. Download the `.vsix` file.
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type `Extensions: Install from VSIX...`
5. Select the `.vsix` file

**Option B — CLI:**
```bash
code --install-extension status-monitor-0.0.1.vsix
```

## Configuration

After installing, configure via VS Code Settings or directly in `settings.json`:

```jsonc
{
  // Shell command to run
  "statusMonitor.command": "echo ok",

  // Env variable name to forward into the command environment (optional)
  "statusMonitor.envVariable": "MY_API_KEY",

  // How often to re-run, in seconds
  "statusMonitor.intervalSeconds": 10,

  // Regex: output matching this → green
  "statusMonitor.successPattern": "ok|healthy",

  // Regex: output matching this → yellow  (checked after success)
  "statusMonitor.warningPattern": "warn|degraded",

  // Default label shown next to the icon (empty = icon only)
  "statusMonitor.label": "Monitor",

  // Status-specific labels (fall back to statusMonitor.label if empty)
  "statusMonitor.labelSuccess": "",
  "statusMonitor.labelWarning": "",
  "statusMonitor.labelFailure": ""
}
```

The status bar item appears on the **bottom-right** of VS Code. Click it to refresh immediately. Hover for full command output.


## Example: SLURM walltime warning

I made the extension to have it warn me when the SLURM job that of the remote vscode is running out of time. Add this to your user settings:

```jsonc
{
  "statusMonitor.command": "status=$(sacct -j $SLURM_JOB_ID -X -n -P --format=\"time,elapsed,state\"); [ -z \"$status\" ] && echo \"OK\" || [[ $status == *\"CANCELLED\"* ]] && echo \"CANCELLED\" || echo $status | awk -F'[:|]' '{m=($1*60+$2)-($4*60+$5); if(m>30) print \"PLENTY\"; else if(m>5) print \"TWENTY\"; else print \"FIVE\"}'",
  "statusMonitor.envVariable": "SLURM_JOB_ID", 
  "statusMonitor.intervalSeconds": 30,
  "statusMonitor.successPattern": "OK|PLENTY",
  "statusMonitor.warningPattern": "TWENTY",
  "statusMonitor.labelWarning": "Less than <20 min left on SLURM",
  "statusMonitor.labelFailure": "SLURM job will self-destruct in <5 min",
}
```