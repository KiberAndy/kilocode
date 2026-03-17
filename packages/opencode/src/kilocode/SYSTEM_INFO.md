# System Information Feature

Kilo automatically collects hardware information to provide better AI assistance.

## What is collected

- **CPU model** — Processor name and model
- **GPU model(s)** — Graphics card(s) installed
- **Total RAM** — System memory size
- **Platform** — Windows/Linux/macOS
- **Architecture** — x64/ARM

## Example output

```xml
<env>
  Working directory: /home/user/project
  Is directory a git repo: yes
  Platform: linux
  Architecture: x64
  CPU: 12th Gen Intel(R) Core(TM) i7-12700K
  GPU: NVIDIA GeForce RTX 3080
  RAM: 32 GB
</env>
```

## Why this is useful

The AI uses this information to:

1. **Suggest appropriate solutions** — Won't recommend running 70B LLM on 8GB RAM
2. **Optimize commands** — Uses parallel execution on multi-core CPUs
3. **Warn about limitations** — Alerts when Docker + IDE might exceed available RAM
4. **Platform-specific advice** — Different commands for Windows vs Linux vs macOS
5. **GPU acceleration** — Suggests CUDA/OpenCL when compatible GPU detected

## Privacy

This information is:

- ✅ Sent **ONLY** to the AI model as part of the system prompt
- ✅ **NOT** sent to telemetry or analytics
- ✅ **NOT** stored on disk
- ✅ **NOT** shared with third parties
- ✅ Cached **only in memory** (cleared on process exit)
- ✅ Collected **once per session** (not on every request)

## Disable

To disable system information collection, add to `.opencode/opencode.jsonc`:

```jsonc
{
  "experimental": {
    "disable_system_info": true
  }
}
```

When disabled, hardware fields will show as "unknown":

```xml
<env>
  Platform: win32
  Architecture: x64
  CPU: unknown
  GPU: unknown
  RAM: unknown
</env>
```

## Troubleshooting

### Linux

Ensure these commands are available:
- `cat /proc/cpuinfo` — CPU info
- `lspci` — GPU info (usually in `pciutils` package)
- `free` — RAM info (usually in `procps` package)

### macOS

No additional dependencies required. Uses built-in `sysctl` commands.

### Windows

Uses built-in `wmic` commands. No dependencies required.

### Slow startup

System info is collected once and cached. If collection is slow (>5s), it times out and shows "unknown".

## Technical details

- **Module:** `packages/opencode/src/kilocode/system-info.ts`
- **Integration:** `packages/opencode/src/session/system.ts:environment()`
- **Cache:** In-memory, per-session
- **Timeout:** 5 seconds per command
- **Error handling:** Graceful degradation to "unknown"
