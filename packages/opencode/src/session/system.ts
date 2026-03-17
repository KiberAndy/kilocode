import { Ripgrep } from "../file/ripgrep"

import { Global } from "../global" // kilocode_change
import { Instance } from "../project/instance"

import PROMPT_ANTHROPIC from "./prompt/anthropic.txt"
import PROMPT_ANTHROPIC_WITHOUT_TODO from "./prompt/qwen.txt"
import PROMPT_BEAST from "./prompt/beast.txt"
import PROMPT_GEMINI from "./prompt/gemini.txt"

import PROMPT_CODEX from "./prompt/codex_header.txt"
import PROMPT_TRINITY from "./prompt/trinity.txt"
import PROMPT_KILO_CUSTOM from "./prompt/kilo-custom.txt" // kilocode_change - custom prompt
import type { Provider } from "@/provider/provider"
import { Config } from "@/config/config" // kilocode_change - for system info disable flag

// kilocode_change start
import { staticEnvLines, type EditorContext } from "../kilocode/editor-context"
import { SystemInfo } from "../kilocode/system-info"
// kilocode_change end

export namespace SystemPrompt {
  export function instructions() {
    return PROMPT_CODEX.trim()
  }

  // kilocode_change start
  export function soul() {
    return SOUL.trim()
  }
  // kilocode_change end

  export function provider(model: Provider.Model) {
    // kilocode_change start - use single custom prompt for ALL models
    return [PROMPT_KILO_CUSTOM]
    // kilocode_change end
  }

  // kilocode_change start
  export async function environment(model: Provider.Model, editorContext?: EditorContext) {
    // kilocode_change end
    const project = Instance.project
    
    // kilocode_change start - check if system info is disabled
    const cfg = await Config.get()
    const disableSystemInfo = cfg.experimental?.disable_system_info === true
    const sysInfo = disableSystemInfo ? null : await SystemInfo.get()
    // kilocode_change end
    
    return [
      [
        `You are powered by the model named ${model.api.id}. The exact model ID is ${model.providerID}/${model.api.id}`,
        `Here is some useful information about the environment you are running in:`,
        `<env>`,
        `  Working directory: ${Instance.directory}`,
        `  Is directory a git repo: ${project.vcs === "git" ? "yes" : "no"}`,
        `  Platform: ${sysInfo?.platform || process.platform}`,
        `  Architecture: ${sysInfo?.arch || process.arch}`,
        `  CPU: ${disableSystemInfo ? "unknown" : (sysInfo?.cpu || "unknown")}`,
        `  GPU: ${disableSystemInfo ? "unknown" : (sysInfo?.gpu?.length ? sysInfo.gpu.join(", ") : "unknown")}`,
        `  RAM: ${disableSystemInfo ? "unknown" : (sysInfo?.ram || "unknown")}`,
        `  Project config: .kilo/command/*.md, .kilo/agent/*.md, kilo.json, AGENTS.md. Put new commands and agents in .kilo/. Do not use .kilocode/ or .opencode/.`, // kilocode_change
        `  Global config: ${Global.Path.config}/ (same structure)`, // kilocode_change
        ...staticEnvLines(editorContext), // kilocode_change
        `</env>`,
        `<directories>`,
        `  ${
          project.vcs === "git" && false
            ? await Ripgrep.tree({
                cwd: Instance.directory,
                limit: 50,
              })
            : ""
        }`,
        `</directories>`,
      ].join("\n"),
    ]
  }
}
