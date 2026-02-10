import { createImageTool } from "./image";
import { createSearchTool } from "./search";
import { createVideoTool } from "./video";
import type { CreateChatToolsOptions } from "./types";

export function createChatTools({ videoMode, imageMode }: CreateChatToolsOptions) {
  return {
    search: createSearchTool(),
    ...(videoMode ? { video: createVideoTool() } : {}),
    ...(imageMode ? { image: createImageTool() } : {}),
  };
}
