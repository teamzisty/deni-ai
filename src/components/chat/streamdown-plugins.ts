"use client";

import type { PluginConfig } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { lazyMermaid } from "@/components/chat/streamdown-mermaid-plugin";

/**
 * Shared Streamdown plugin map.
 *
 * Cast through PluginConfig: @streamdown/code and streamdown can resolve
 * different shiki language unions in the same install, which otherwise fails
 * structural typing on `plugins`.
 */
export const streamdownPlugins = {
  cjk,
  code,
  math,
  mermaid: lazyMermaid,
} as PluginConfig;
