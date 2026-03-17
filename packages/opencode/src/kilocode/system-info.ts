// kilocode_change - new file: system information collector

export namespace SystemInfo {
  export interface Info {
    cpu?: string
    gpu?: string[]
    ram?: string
    platform: string
    arch: string
  }

  let cached: Info | null = null

  export async function get(): Promise<Info> {
    if (cached) return cached

    const info: Info = {
      platform: process.platform,
      arch: process.arch,
    }

    try {
      if (process.platform === "win32") {
        await collectWindows(info)
      } else if (process.platform === "linux") {
        await collectLinux(info)
      } else if (process.platform === "darwin") {
        await collectMacos(info)
      }
    } catch (error) {
      // Ignore errors - system info is optional
      info.cpu = "unknown"
      info.gpu = []
      info.ram = "unknown"
    }

    cached = info
    return info
  }

  async function collectWindows(info: Info) {
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)

    // CPU
    try {
      const { stdout } = await execAsync(
        "wmic cpu get name /format:csv",
        { encoding: "utf8", timeout: 5000 }
      )
      const lines = stdout.trim().split("\n").filter(l => l.trim())
      if (lines.length > 1) {
        info.cpu = lines[lines.length - 1].trim()
      }
    } catch {}

    // GPU
    try {
      const { stdout } = await execAsync(
        "wmic path win32_videocontroller get name /format:csv",
        { encoding: "utf8", timeout: 5000 }
      )
      const lines = stdout.trim().split("\n").filter(l => l.trim())
      info.gpu = lines.slice(1).map(l => l.trim()).filter(Boolean)
    } catch {}

    // RAM
    try {
      const { stdout } = await execAsync(
        "wmic OS get TotalVisibleMemorySize /format:csv",
        { encoding: "utf8", timeout: 5000 }
      )
      const lines = stdout.trim().split("\n").filter(l => l.trim())
      if (lines.length > 1) {
        const ramKB = parseInt(lines[lines.length - 1].trim(), 10)
        const ramGB = Math.round(ramKB / 1024 / 1024)
        info.ram = `${ramGB} GB`
      }
    } catch {}
  }

  async function collectLinux(info: Info) {
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)

    // CPU
    try {
      const { stdout } = await execAsync("cat /proc/cpuinfo | grep 'model name' | head -1", {
        encoding: "utf8",
        timeout: 5000,
      })
      const match = stdout.match(/model name\s*:\s*(.+)/)
      if (match) info.cpu = match[1].trim()
    } catch {}

    // GPU
    try {
      const { stdout } = await execAsync("lspci | grep -i vga | head -1", {
        encoding: "utf8",
        timeout: 5000,
      })
      if (stdout.trim()) info.gpu = [stdout.trim()]
    } catch {}

    // RAM
    try {
      const { stdout } = await execAsync("free -h | awk '/^Mem:/ {print $2}'", {
        encoding: "utf8",
        timeout: 5000,
      })
      if (stdout.trim()) info.ram = stdout.trim()
    } catch {}
  }

  async function collectMacos(info: Info) {
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)

    // CPU / Chip
    try {
      const { stdout } = await execAsync("sysctl -n machdep.cpu.brand_string", {
        encoding: "utf8",
        timeout: 5000,
      })
      if (stdout.trim()) info.cpu = stdout.trim()
    } catch {}

    // GPU
    try {
      const { stdout } = await execAsync("system_profiler SPDisplaysDataType | grep 'Chipset Model' | head -1", {
        encoding: "utf8",
        timeout: 5000,
      })
      const match = stdout.match(/Chipset Model:\s*(.+)/)
      if (match) info.gpu = [match[1].trim()]
    } catch {}

    // RAM
    try {
      const { stdout } = await execAsync("sysctl -n hw.memsize", {
        encoding: "utf8",
        timeout: 5000,
      })
      const ramBytes = parseInt(stdout.trim(), 10)
      const ramGB = Math.round(ramBytes / 1024 / 1024 / 1024)
      info.ram = `${ramGB} GB`
    } catch {}
  }
}
