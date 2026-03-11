import { createImageTool } from "./image";
import { createSearchTool } from "./search";
import { createVideoTool } from "./video";
import type { CreateChatToolsOptions } from "./types";

export function createChatTools({
  videoMode,
  imageMode,
  webSearch = true,
}: CreateChatToolsOptions) {
  return {
    ...(webSearch ? { search: createSearchTool() } : {}),
    ...(videoMode ? { video: createVideoTool() } : {}),
    ...(imageMode ? { image: createImageTool() } : {}),
  };
}
