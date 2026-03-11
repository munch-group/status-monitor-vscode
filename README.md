# Status Monitor — VS Code Extension

Runs a shell command on an interval and reflects the result as a **colored icon in the status bar**.

- 🟢 **Green** — output matches your success pattern
- 🟡 **Yellow** — output matches your warning pattern  
- 🔴 **Red** — everything else / command failed
- 🔄 **Spinning** — command is running

Click the icon to refresh immediately. Hover for full output.

---

## Settings (`settings.json`)

```jsonc
{
  // Shell command to run
  "statusMonitor.command": "curl -s https://myapi/health | jq -r .status",

  // Optional: name of an env variable to forward into the command's environment
  "statusMonitor.envVariable": "MY_API_KEY",

  // Poll interval in seconds (default: 10)
  "statusMonitor.intervalSeconds": 30,

  // Regex: output matching this → green
  "statusMonitor.successPattern": "healthy|ok",

  // Regex: output matching this → yellow (checked after success)
  "statusMonitor.warningPattern": "degraded|warn"
}
```

---

## Install Extension

Download `status-monitor.vsix` and install using command palette (Cmd-Shift-P): "Extensions: Install from VSIX..."


## Walltime warning

To make the utility warn you when the slurm job of the remote vscode is running out of time, add this to your user settings:

```json
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